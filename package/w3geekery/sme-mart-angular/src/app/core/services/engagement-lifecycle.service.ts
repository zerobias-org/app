import { Injectable, inject } from '@angular/core';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import { SuggestTagBody } from '@zerobias-com/platform-sdk';
import { Nmtoken } from '@zerobias-org/types-core-js';
import { ProposalsService } from './proposals.service';
import { WorkRequestsService } from './work-requests.service';
import type { Proposal, WorkRequest } from '../models';

/**
 * BIP39-style word list for generating human-readable engagement tags.
 * Format: ENG-word-word (e.g., ENG-ocean-tiger, ENG-amber-falcon)
 */
const WORDS = [
  // Animals
  'tiger', 'falcon', 'otter', 'raven', 'cobra', 'panda', 'eagle', 'shark',
  'bison', 'crane', 'viper', 'finch', 'moose', 'gecko', 'heron', 'manta',
  'lynx', 'quail', 'stoat', 'swift', 'trout', 'wren', 'ibis', 'dingo',
  // Colors & materials
  'amber', 'azure', 'coral', 'ivory', 'onyx', 'ruby', 'slate', 'jade',
  'pearl', 'brass', 'cedar', 'steel', 'frost', 'ember', 'cobalt', 'crimson',
  // Nature
  'ocean', 'ridge', 'delta', 'maple', 'storm', 'grove', 'cliff', 'brook',
  'crest', 'stone', 'thorn', 'bloom', 'flint', 'marsh', 'blaze', 'drift',
  'peak', 'vale', 'reef', 'dune', 'fern', 'moss', 'pine', 'birch',
  // Objects & concepts
  'prism', 'vault', 'forge', 'latch', 'nexus', 'relay', 'shard', 'spark',
  'tower', 'anvil', 'orbit', 'pulse', 'helix', 'gauge', 'lever', 'pivot',
  'badge', 'blade', 'crown', 'arrow', 'lance', 'shield', 'helm',
  // Abstract
  'bold', 'keen', 'calm', 'true', 'brave', 'clear', 'prime',
  'noble', 'stern', 'vivid', 'stark', 'lunar', 'solar', 'astral', 'nova',
  // Tech-ish
  'pixel', 'sigma', 'theta', 'omega', 'gamma', 'alpha', 'kappa',
  'logic', 'vector', 'cipher', 'proxy', 'macro', 'micro', 'qubit', 'fiber',
  // Places & geography
  'mesa', 'fjord', 'basin', 'ledge', 'cavern', 'inlet', 'summit', 'strait',
  'harbor', 'glade', 'oasis', 'tundra', 'canyon', 'lagoon', 'shoal', 'knoll',
  // Misc memorable
  'atlas', 'tempo', 'chord', 'grain', 'hatch', 'lotus', 'plume',
  'relic', 'scope', 'token', 'vigil', 'chalk', 'flare', 'glyph', 'knack',
];

function randomWord(): string {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

@Injectable({ providedIn: 'root' })
export class EngagementLifecycleService {
  private readonly clientApi = inject(ZerobiasClientApi);
  private readonly proposals = inject(ProposalsService);
  private readonly workRequests = inject(WorkRequestsService);

  /**
   * Generate a BIP39-style engagement tag: ENG-word-word
   */
  generateEngagementTag(): string {
    const w1 = randomWord();
    let w2 = randomWord();
    while (w2 === w1) {
      w2 = randomWord();
    }
    return `ENG-${w1}-${w2}`;
  }

  /**
   * Generate a unique tag not in the existing set.
   * Falls back after 50 attempts (collision extremely unlikely with ~200^2 combos).
   */
  generateUniqueEngagementTag(existingTags: string[]): string {
    const existing = new Set(existingTags);
    for (let i = 0; i < 50; i++) {
      const tag = this.generateEngagementTag();
      if (!existing.has(tag)) return tag;
    }
    return `${this.generateEngagementTag()}-${Math.floor(Math.random() * 1000)}`;
  }

  /** Check if an engagement tag indicates RFP phase (no tag yet). */
  isRfpPhase(engagementTag: string | null | undefined): boolean {
    return !engagementTag;
  }

  /** Check if an engagement tag indicates active engagement phase. */
  isEngagementPhase(engagementTag: string | null | undefined): boolean {
    return !!engagementTag && engagementTag.startsWith('ENG-');
  }

  /**
   * Orchestrated proposal acceptance workflow:
   * 1. Generate engagement tag
   * 2. Create ZeroBias Tag via suggestTag API
   * 3. Accept the proposal
   * 4. Graduate the work request to engagement
   */
  async acceptProposal(proposalId: string, requestId: string): Promise<{
    proposal: Proposal;
    workRequest: WorkRequest;
    engagementTag: string;
    zerobiasTagId?: string;
  }> {
    const engagementTag = this.generateEngagementTag();

    // Create ZeroBias platform tag for tracking
    let zerobiasTagId: string | undefined;
    try {
      const tagBody = new SuggestTagBody(
        engagementTag,
        `SME Mart engagement: ${engagementTag}`,
        new Nmtoken('service-segment'),
      );
      const task = await this.clientApi.auditmationPlatform
        .getTagApi()
        .suggestTag(tagBody);
      zerobiasTagId = task?.id?.toString();
    } catch (err) {
      console.warn('[EngagementLifecycle] Failed to create ZB tag, continuing without:', err);
    }

    // Accept proposal and graduate work request in parallel
    const [proposal, workRequest] = await Promise.all([
      this.proposals.acceptProposal(proposalId),
      this.workRequests.graduateToEngagement(requestId, engagementTag, zerobiasTagId),
    ]);

    return { proposal, workRequest, engagementTag, zerobiasTagId };
  }
}
