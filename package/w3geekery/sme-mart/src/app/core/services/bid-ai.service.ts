import { Injectable, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { EngagementsService } from '../../core/services/engagements.service';
import { ProviderProfilesService } from './provider-profiles.service';
import { OrgDocumentService } from './org-document.service';
import { ImpersonationService } from './impersonation.service';
import type { RfpData, RfpTaskGroup } from '../models/rfp.model';
import type { BidWizardData, TaskTypePricing } from '../models/bid.model';
import type {
  BidGenerationContext,
  BidAiResponse,
  BidAiProgress,
  BidAiRequirementResponse,
  BidAiSectionType,
} from '../models/bid-ai.model';

/**
 * Orchestrates AI-assisted bid generation.
 *
 * 1. Gathers context (RFP requirements, vendor profile, org docs)
 * 2. Calls Vercel Edge `/api/llm/generate-bid` (streams SSE from Anthropic)
 * 3. Parses streamed JSON into BidWizardData + BidAiRequirementResponse[]
 *
 * Plan 033, Phase 5
 */
@Injectable({ providedIn: 'root' })
export class BidAiService {
  private readonly engagements = inject(EngagementsService);
  private readonly providerProfiles = inject(ProviderProfilesService);
  private readonly orgDocuments = inject(OrgDocumentService);
  private readonly impersonation = inject(ImpersonationService);

  readonly progress$ = new Subject<BidAiProgress>();

  private abortController: AbortController | null = null;

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Generate a full bid draft from RFP + vendor context.
   * Returns the parsed response when complete.
   * Emits progress updates via `progress$`.
   */
  async generateBidDraft(
    rfpId: string,
    providerId: string,
    sections?: BidAiSectionType[],
  ): Promise<BidAiResponse> {
    this.abortController = new AbortController();

    try {
      // Step 1: Gather context
      this.emitProgress('gathering', 'Loading RFP requirements and vendor profile...', 5);
      const context = await this.gatherContext(rfpId, providerId);
      this.emitProgress('gathering', 'Context gathered. Starting AI generation...', 15);

      // Step 2: Call LLM via Edge route
      this.emitProgress('generating', 'Generating bid draft with AI...', 20);
      const rawJson = await this.callLlmEndpoint(context, sections);
      this.emitProgress('parsing', 'Parsing AI response...', 85);

      // Step 3: Parse response
      const response = this.parseLlmResponse(rawJson);
      this.emitProgress('complete', 'AI draft ready for review.', 100);
      return response;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        this.emitProgress('error', 'Generation cancelled.', 0);
        throw err;
      }
      this.emitProgress('error', `AI generation failed: ${err.message}`, 0);
      throw err;
    } finally {
      this.abortController = null;
    }
  }

  /** Cancel an in-progress generation. */
  cancel(): void {
    this.abortController?.abort();
  }

  // ---------------------------------------------------------------------------
  // Context Gathering
  // ---------------------------------------------------------------------------

  async gatherContext(rfpId: string, providerId: string): Promise<BidGenerationContext> {
    // Load RFP + vendor in parallel
    const [rfpData, provider] = await Promise.all([
      this.loadRfpData(rfpId),
      this.providerProfiles.getProvider(providerId),
    ]);

    const vendor: BidGenerationContext['vendor'] = {
      displayName: provider?.display_name || 'Unknown Vendor',
      headline: (provider as any)?.headline ?? undefined,
      bio: (provider as any)?.bio ?? undefined,
    };

    // Parse aggregated JSON from VIEW (skills, frameworks)
    if (provider) {
      const parse = this.providerProfiles.parseViewJson.bind(this.providerProfiles);
      const skills = parse<{ name: string }>((provider as any)?.skills_json);
      if (skills.length) vendor.skills = skills.map(s => s.name);
      const frameworks = parse<{ name: string }>((provider as any)?.frameworks_json);
      if (frameworks.length) vendor.frameworks = frameworks.map(f => f.name);
    }

    // Load org docs summaries (best-effort, non-blocking)
    let orgDocSummaries: string[] = [];
    try {
      const orgId = this.impersonation.effectiveOrgId?.();
      if (orgId) {
        const docs = await this.orgDocuments.listDocuments(orgId, { pageSize: 10 });
        orgDocSummaries = docs
          .filter(d => d.display_name)
          .map(d => `${d.display_name} (${d.document_type || 'general'}): ${d.description || 'No description'}`);
      }
    } catch {
      // Graceful degradation — generate without org docs
    }

    return {
      rfp: rfpData,
      vendor,
      orgDocSummaries: orgDocSummaries.length > 0 ? orgDocSummaries : undefined,
    };
  }

  private async loadRfpData(rfpId: string): Promise<BidGenerationContext['rfp']> {
    const rfp = await this.engagements.getEngagement(rfpId);
    const rawEngagement = await this.engagements.getEngagementRaw(rfpId);
    const wizardData = (rawEngagement as any)?.rfp_wizard_data as RfpData | undefined;

    return {
      title: rfp?.title || '',
      description: rfp?.description || '',
      category: wizardData?.category,
      budgetType: wizardData?.budgetType ?? undefined,
      budgetMin: wizardData?.budgetMin,
      budgetMax: wizardData?.budgetMax,
      timeline: wizardData?.timeline,
      taskGroups: wizardData?.taskGroups || [],
    };
  }

  // ---------------------------------------------------------------------------
  // LLM Call (Streaming SSE via Vercel Edge)
  // ---------------------------------------------------------------------------

  private async callLlmEndpoint(
    context: BidGenerationContext,
    sections?: BidAiSectionType[],
  ): Promise<string> {
    const response = await fetch('/api/llm/generate-bid', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context, sections }),
      signal: this.abortController?.signal,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(err.error || `LLM service returned ${response.status}`);
    }

    // Read SSE stream and accumulate text content
    return this.readAnthropicStream(response);
  }

  /** Read Anthropic SSE stream, accumulate text deltas, emit progress. */
  private async readAnthropicStream(response: Response): Promise<string> {
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let accumulated = '';
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;

          try {
            const event = JSON.parse(data);
            if (event.type === 'content_block_delta' && event.delta?.text) {
              accumulated += event.delta.text;
              // Estimate progress based on accumulated length
              const estimatedTotal = 4000; // rough char count for full response
              const pct = Math.min(80, 20 + Math.floor((accumulated.length / estimatedTotal) * 60));
              this.emitProgress('generating', 'Generating bid draft...', pct);
            }
          } catch {
            // Skip non-JSON lines
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return accumulated;
  }

  // ---------------------------------------------------------------------------
  // Response Parsing
  // ---------------------------------------------------------------------------

  parseLlmResponse(rawJson: string): BidAiResponse {
    // Extract JSON from potential markdown code blocks
    let jsonStr = rawJson.trim();
    const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) {
      jsonStr = fenceMatch[1].trim();
    }

    let parsed: any;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      throw new Error('Failed to parse AI response as JSON. The AI may have returned an unexpected format.');
    }

    // Map to BidWizardData
    const wizardData: BidWizardData = {
      approach: {
        executive_summary: parsed.executive_summary || '',
        cover_letter: parsed.cover_letter || '',
      },
      team: {
        team_description: parsed.team_description || '',
      },
      pricing: {
        proposed_price: parsed.proposed_price || '',
        proposed_timeline: parsed.proposed_timeline || '',
        total_estimated_hours: 0,
        pricing_breakdown: [],
      },
    };

    // Map pricing breakdown
    if (Array.isArray(parsed.pricing_breakdown)) {
      const breakdown: TaskTypePricing[] = parsed.pricing_breakdown.map((row: any) => ({
        taskType: row.taskType || row.task_type || '',
        estimatedHours: Number(row.estimatedHours ?? row.estimated_hours ?? 0),
        estimatedCost: Number(row.estimatedCost ?? row.estimated_cost ?? 0),
        notes: row.notes,
      }));
      wizardData.pricing!.pricing_breakdown = breakdown;
      wizardData.pricing!.total_estimated_hours = breakdown.reduce(
        (sum, r) => sum + r.estimatedHours, 0,
      );
    }

    // Map requirement responses
    const requirementResponses: BidAiRequirementResponse[] = [];
    if (Array.isArray(parsed.requirement_responses)) {
      for (const r of parsed.requirement_responses) {
        requirementResponses.push({
          requirementId: r.requirementId || r.requirement_id || '',
          complianceStatus: r.complianceStatus || r.compliance_status || 'not_met',
          responseText: r.responseText || r.response_text || '',
          estimatedHours: Number(r.estimatedHours ?? r.estimated_hours ?? 0),
          estimatedCost: Number(r.estimatedCost ?? r.estimated_cost ?? 0),
        });
      }
    }

    return {
      wizardData,
      requirementResponses,
      model: 'claude-sonnet-4-5-20250514',
    };
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private emitProgress(
    status: BidAiProgress['status'],
    message: string,
    percent: number,
  ): void {
    this.progress$.next({ status, message, percent });
  }
}
