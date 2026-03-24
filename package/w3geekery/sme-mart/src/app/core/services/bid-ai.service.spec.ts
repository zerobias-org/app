import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { BidAiService } from './bid-ai.service';
import { EngagementsService } from '../../core/services/engagements.service';
import { ProviderProfilesService } from './provider-profiles.service';
import { OrgDocumentService } from './org-document.service';
import { ImpersonationService } from './impersonation.service';
import type { BidAiProgress } from '../models/bid-ai.model';

describe('BidAiService', () => {
  let service: BidAiService;
  let mockWorkRequests: any;
  let mockProviderProfiles: any;
  let mockOrgDocuments: any;
  let mockImpersonation: any;

  beforeEach(() => {
    mockWorkRequests = {
      getEngagement: vi.fn().mockResolvedValue({
        title: 'HIPAA Assessment',
        description: 'Full HIPAA assessment needed',
      }),
      getEngagementRaw: vi.fn().mockResolvedValue({
        rfp_wizard_data: {
          category: 'compliance',
          budgetType: 'fixed',
          budgetMin: 5000,
          budgetMax: 15000,
          timeline: '6 weeks',
          taskGroups: [
            {
              id: 'tg-1',
              displayName: 'Risk Analysis',
              requirements: [
                { id: 'req-1', title: 'Gap analysis', description: 'Perform gap analysis' },
              ],
            },
          ],
        },
      }),
    };

    mockProviderProfiles = {
      getProvider: vi.fn().mockResolvedValue({
        id: 'p-001',
        display_name: 'Acme Security',
        headline: 'Expert compliance consultants',
        bio: 'We specialize in HIPAA.',
        skills_json: JSON.stringify([{ name: 'HIPAA' }, { name: 'Risk Assessment' }]),
        frameworks_json: JSON.stringify([{ name: 'NIST CSF' }]),
      }),
      parseViewJson: vi.fn((json: string) => {
        try { return JSON.parse(json); } catch { return []; }
      }),
    };

    mockOrgDocuments = {
      listDocuments: vi.fn().mockResolvedValue([
        { display_name: 'Company Overview', document_type: 'profile', description: 'About us' },
      ]),
    };

    mockImpersonation = {
      effectiveOrgId: vi.fn().mockReturnValue('org-001'),
    };

    TestBed.configureTestingModule({
      providers: [
        BidAiService,
        { provide: EngagementsService, useValue: mockWorkRequests },
        { provide: ProviderProfilesService, useValue: mockProviderProfiles },
        { provide: OrgDocumentService, useValue: mockOrgDocuments },
        { provide: ImpersonationService, useValue: mockImpersonation },
      ],
    });

    service = TestBed.inject(BidAiService);
  });

  // ---------------------------------------------------------------------------
  // gatherContext
  // ---------------------------------------------------------------------------

  describe('gatherContext', () => {
    it('should load RFP data and vendor profile in parallel', async () => {
      const ctx = await service.gatherContext('rfp-001', 'p-001');

      expect(mockWorkRequests.getEngagement).toHaveBeenCalledWith('rfp-001');
      expect(mockProviderProfiles.getProvider).toHaveBeenCalledWith('p-001');
      expect(ctx.rfp.title).toBe('HIPAA Assessment');
      expect(ctx.vendor.displayName).toBe('Acme Security');
    });

    it('should extract vendor skills and frameworks from VIEW JSON', async () => {
      const ctx = await service.gatherContext('rfp-001', 'p-001');

      expect(ctx.vendor.skills).toEqual(['HIPAA', 'Risk Assessment']);
      expect(ctx.vendor.frameworks).toEqual(['NIST CSF']);
    });

    it('should load org document summaries', async () => {
      const ctx = await service.gatherContext('rfp-001', 'p-001');

      expect(mockOrgDocuments.listDocuments).toHaveBeenCalledWith('org-001', { pageSize: 10 });
      expect(ctx.orgDocSummaries).toEqual([
        'Company Overview (profile): About us',
      ]);
    });

    it('should gracefully handle org doc loading failure', async () => {
      mockOrgDocuments.listDocuments.mockRejectedValue(new Error('Network error'));

      const ctx = await service.gatherContext('rfp-001', 'p-001');

      expect(ctx.orgDocSummaries).toBeUndefined();
      expect(ctx.rfp.title).toBe('HIPAA Assessment'); // Rest still works
    });

    it('should handle missing provider gracefully', async () => {
      mockProviderProfiles.getProvider.mockResolvedValue(null);

      const ctx = await service.gatherContext('rfp-001', 'p-001');

      expect(ctx.vendor.displayName).toBe('Unknown Vendor');
    });

    it('should extract task groups from rfp_wizard_data', async () => {
      const ctx = await service.gatherContext('rfp-001', 'p-001');

      expect(ctx.rfp.taskGroups).toHaveLength(1);
      expect(ctx.rfp.taskGroups[0].displayName).toBe('Risk Analysis');
    });

    it('should handle missing rfp_wizard_data', async () => {
      mockWorkRequests.getEngagementRaw.mockResolvedValue({});

      const ctx = await service.gatherContext('rfp-001', 'p-001');

      expect(ctx.rfp.taskGroups).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // parseLlmResponse
  // ---------------------------------------------------------------------------

  describe('parseLlmResponse', () => {
    const validJson = JSON.stringify({
      executive_summary: 'Our approach to HIPAA compliance...',
      cover_letter: 'Dear buyer, we are excited...',
      team_description: 'Our team has 10 years of experience...',
      proposed_price: '12000',
      proposed_timeline: '6 weeks',
      pricing_breakdown: [
        { taskType: 'Risk Analysis', estimatedHours: 40, estimatedCost: 4000 },
        { taskType: 'Remediation', estimatedHours: 60, estimatedCost: 6000 },
      ],
      requirement_responses: [
        {
          requirementId: 'req-1',
          complianceStatus: 'fully_met',
          responseText: 'We can do gap analysis.',
          estimatedHours: 20,
          estimatedCost: 2000,
        },
      ],
    });

    it('should parse valid JSON into BidAiResponse', () => {
      const result = service.parseLlmResponse(validJson);

      expect(result.wizardData.approach?.executive_summary).toBe('Our approach to HIPAA compliance...');
      expect(result.wizardData.approach?.cover_letter).toBe('Dear buyer, we are excited...');
      expect(result.wizardData.team?.team_description).toBe('Our team has 10 years of experience...');
      expect(result.wizardData.pricing?.proposed_price).toBe('12000');
      expect(result.wizardData.pricing?.proposed_timeline).toBe('6 weeks');
    });

    it('should parse pricing breakdown', () => {
      const result = service.parseLlmResponse(validJson);

      expect(result.wizardData.pricing?.pricing_breakdown).toHaveLength(2);
      expect(result.wizardData.pricing?.pricing_breakdown?.[0]).toEqual({
        taskType: 'Risk Analysis',
        estimatedHours: 40,
        estimatedCost: 4000,
        notes: undefined,
      });
      expect(result.wizardData.pricing?.total_estimated_hours).toBe(100);
    });

    it('should parse requirement responses', () => {
      const result = service.parseLlmResponse(validJson);

      expect(result.requirementResponses).toHaveLength(1);
      expect(result.requirementResponses[0]).toEqual({
        requirementId: 'req-1',
        complianceStatus: 'fully_met',
        responseText: 'We can do gap analysis.',
        estimatedHours: 20,
        estimatedCost: 2000,
      });
    });

    it('should handle JSON wrapped in markdown code fences', () => {
      const wrapped = '```json\n' + validJson + '\n```';
      const result = service.parseLlmResponse(wrapped);

      expect(result.wizardData.approach?.executive_summary).toBe('Our approach to HIPAA compliance...');
    });

    it('should handle JSON wrapped in plain code fences', () => {
      const wrapped = '```\n' + validJson + '\n```';
      const result = service.parseLlmResponse(wrapped);

      expect(result.wizardData.approach?.cover_letter).toBe('Dear buyer, we are excited...');
    });

    it('should throw on invalid JSON', () => {
      expect(() => service.parseLlmResponse('not json at all'))
        .toThrow('Failed to parse AI response as JSON');
    });

    it('should handle snake_case field names from LLM', () => {
      const snakeCaseJson = JSON.stringify({
        executive_summary: 'Summary',
        cover_letter: 'Letter',
        team_description: 'Team',
        pricing_breakdown: [
          { task_type: 'Audit', estimated_hours: 30, estimated_cost: 3000 },
        ],
        requirement_responses: [
          { requirement_id: 'req-2', compliance_status: 'partially_met', response_text: 'Partly done', estimated_hours: 10, estimated_cost: 1000 },
        ],
      });

      const result = service.parseLlmResponse(snakeCaseJson);

      expect(result.wizardData.pricing?.pricing_breakdown?.[0].taskType).toBe('Audit');
      expect(result.requirementResponses[0].requirementId).toBe('req-2');
      expect(result.requirementResponses[0].complianceStatus).toBe('partially_met');
    });

    it('should default missing fields to empty strings', () => {
      const minimal = JSON.stringify({});
      const result = service.parseLlmResponse(minimal);

      expect(result.wizardData.approach?.executive_summary).toBe('');
      expect(result.wizardData.approach?.cover_letter).toBe('');
      expect(result.wizardData.team?.team_description).toBe('');
      expect(result.requirementResponses).toEqual([]);
    });

    it('should set model to claude-sonnet', () => {
      const result = service.parseLlmResponse(validJson);
      expect(result.model).toBe('claude-sonnet-4-5-20250514');
    });
  });

  // ---------------------------------------------------------------------------
  // progress$
  // ---------------------------------------------------------------------------

  describe('progress$', () => {
    it('should emit progress updates during gatherContext phase', async () => {
      const updates: BidAiProgress[] = [];
      service.progress$.subscribe(p => updates.push(p));

      // Mock fetch to return a valid SSE stream
      const mockResponse = new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode(
              'data: {"type":"content_block_delta","delta":{"text":"{\\"executive_summary\\":\\"test\\"}"}}\n\n' +
              'data: [DONE]\n\n',
            ));
            controller.close();
          },
        }),
        { status: 200, headers: { 'Content-Type': 'text/event-stream' } },
      );
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse);

      await service.generateBidDraft('rfp-001', 'p-001');

      expect(updates.length).toBeGreaterThan(0);
      expect(updates[0].status).toBe('gathering');
      expect(updates[updates.length - 1].status).toBe('complete');

      vi.restoreAllMocks();
    });
  });

  // ---------------------------------------------------------------------------
  // cancel
  // ---------------------------------------------------------------------------

  describe('cancel', () => {
    it('should abort the fetch when cancel is called', async () => {
      // Make fetch hang until aborted
      vi.spyOn(globalThis, 'fetch').mockImplementation((_url, opts) => {
        return new Promise((_resolve, reject) => {
          opts?.signal?.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'));
          });
        });
      });

      const promise = service.generateBidDraft('rfp-001', 'p-001');

      // Cancel after context gathering starts
      setTimeout(() => service.cancel(), 50);

      await expect(promise).rejects.toThrow();

      vi.restoreAllMocks();
    });
  });
});
