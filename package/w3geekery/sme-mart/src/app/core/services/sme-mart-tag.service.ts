import { Injectable, inject } from '@angular/core';
import { ZerobiasClientApi, ZerobiasClientApp } from '@zerobias-com/zerobias-client';
import { CreateTagBody, TagSearchBody } from '@zerobias-com/hydra-sdk';
import type { TagView, TagExtended } from '@zerobias-com/hydra-sdk';
import { UUID, Nmtoken } from '@zerobias-org/types-core-js';
import {
  SME_MART_PREFIX,
  TagScope,
  TagDimension,
  buildPrefix,
  parseScope,
  stripPrefix,
  isSmeMartTag,
  isProtectedTag,
  isOldConventionTag,
  parseHierarchyLevel,
} from '../utils/tag-prefix.util';

/** Tag type used for all SME Mart tags */
const TAG_TYPE = 'service-segment';

/** BIP39-style word list for generating human-readable tag identifiers */
const WORDS = [
  'tiger', 'falcon', 'otter', 'raven', 'cobra', 'panda', 'eagle', 'shark',
  'bison', 'crane', 'viper', 'finch', 'moose', 'gecko', 'heron', 'manta',
  'lynx', 'quail', 'stoat', 'swift', 'trout', 'wren', 'ibis', 'dingo',
  'amber', 'azure', 'coral', 'ivory', 'onyx', 'ruby', 'slate', 'jade',
  'pearl', 'brass', 'cedar', 'steel', 'frost', 'ember', 'cobalt', 'crimson',
  'ocean', 'ridge', 'delta', 'maple', 'storm', 'grove', 'cliff', 'brook',
  'crest', 'stone', 'thorn', 'bloom', 'flint', 'marsh', 'blaze', 'drift',
  'peak', 'vale', 'reef', 'dune', 'fern', 'moss', 'pine', 'birch',
  'prism', 'vault', 'forge', 'latch', 'nexus', 'relay', 'shard', 'spark',
  'tower', 'anvil', 'orbit', 'pulse', 'helix', 'gauge', 'lever', 'pivot',
  'badge', 'blade', 'crown', 'arrow', 'lance', 'shield', 'helm',
  'bold', 'keen', 'calm', 'true', 'brave', 'clear', 'prime',
  'noble', 'stern', 'vivid', 'stark', 'lunar', 'solar', 'astral', 'nova',
  'pixel', 'sigma', 'theta', 'omega', 'gamma', 'alpha', 'kappa',
  'logic', 'vector', 'cipher', 'proxy', 'macro', 'micro', 'qubit', 'fiber',
  'mesa', 'fjord', 'basin', 'ledge', 'cavern', 'inlet', 'summit', 'strait',
  'harbor', 'glade', 'oasis', 'tundra', 'canyon', 'lagoon', 'shoal', 'knoll',
  'atlas', 'tempo', 'chord', 'grain', 'hatch', 'lotus', 'plume',
  'relic', 'scope', 'token', 'vigil', 'chalk', 'flare', 'glyph', 'knack',
];

function randomWord(): string {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

/**
 * Central service for SME Mart tag operations using the sme-mart.* convention.
 *
 * Uses `danaOld.Tag.createTag` for direct tag creation (not suggestTag).
 * Uses `platform.Tag.searchTags` POST for prefix-based queries.
 * Always passes org ID as ownerId so tags are org-scoped.
 */
@Injectable({ providedIn: 'root' })
export class SmeMartTagService {
  private readonly clientApi = inject(ZerobiasClientApi);
  private readonly app = inject(ZerobiasClientApp);

  // ---------------------------------------------------------------------------
  // Tag generation
  // ---------------------------------------------------------------------------

  /** Generate a word-word identifier (e.g., "amber-circuit") */
  generateIdentifier(): string {
    const w1 = randomWord();
    let w2 = randomWord();
    while (w2 === w1) w2 = randomWord();
    return `${w1}-${w2}`;
  }

  /** Generate a full engagement tag name: sme-mart.eng.word-word */
  generateEngagementTag(): string {
    return `sme-mart.eng.${this.generateIdentifier()}`;
  }

  /** Generate a full project tag name: sme-mart.proj.word-word */
  generateProjectTag(): string {
    return `sme-mart.proj.${this.generateIdentifier()}`;
  }

  /** Generate a full RFP tag name: sme-mart.rfp.word-word */
  generateRfpTag(identifier?: string): string {
    return `sme-mart.rfp.${identifier || this.generateIdentifier()}`;
  }

  /** Generate a full task grouping tag name: sme-mart.task.word-word */
  generateTaskTag(): string {
    return `sme-mart.task.${this.generateIdentifier()}`;
  }

  /**
   * Generate a unique tag not in the existing set.
   * Falls back after 50 attempts (collision extremely unlikely with ~200^2 combos).
   */
  generateUniqueTag(dimension: TagDimension, existingNames: string[]): string {
    const existing = new Set(existingNames);
    for (let i = 0; i < 50; i++) {
      const name = `sme-mart.${dimension}.${this.generateIdentifier()}`;
      if (!existing.has(name)) return name;
    }
    // Fallback with numeric suffix
    return `sme-mart.${dimension}.${this.generateIdentifier()}-${Math.floor(Math.random() * 1000)}`;
  }

  // ---------------------------------------------------------------------------
  // Tag CRUD (danaOld — direct creation)
  // ---------------------------------------------------------------------------

  /**
   * Create a tag directly via danaOld.Tag.createTag.
   * Returns the created tag immediately (no admin approval needed).
   */
  async createTag(name: string, description?: string): Promise<TagView | null> {
    try {
      const orgId = this.getOrgId();
      const body = new CreateTagBody(
        name,
        undefined, // id — auto-generated
        description || '',
        orgId ? new UUID(orgId) : undefined,
        new Nmtoken(TAG_TYPE),
      );
      const tag = await this.clientApi.hydraClient
        .getTagApi()
        .createTag(body);
      return tag as unknown as TagView;
    } catch (err) {
      console.warn(`[SmeMartTag] Failed to create tag "${name}":`, err);
      return null;
    }
  }

  /** Create an engagement tag with a generated name */
  async createEngagementTag(description?: string): Promise<TagView | null> {
    const name = this.generateEngagementTag();
    return this.createTag(name, description || `SME Mart engagement: ${name}`);
  }

  /** Create a project tag with a generated name */
  async createProjectTag(title: string): Promise<TagView | null> {
    const name = this.generateProjectTag();
    return this.createTag(name, `SME Mart project: ${title}`);
  }

  // ---------------------------------------------------------------------------
  // Tag search (platform — prefix matching)
  // ---------------------------------------------------------------------------

  /**
   * Search tags by prefix/partial name using searchTags POST.
   * Use for autocomplete and scope-based queries.
   */
  async searchTags(search: string, limit = 20): Promise<TagExtended[]> {
    try {
      const body = new TagSearchBody();
      body.name = search;
      const result = await this.clientApi.hydraClient
        .getTagApi()
        .searchTags(1, limit, undefined, body);
      return (result.items || []) as TagExtended[];
    } catch (err) {
      console.warn(`[SmeMartTag] Failed to search tags "${search}":`, err);
      return [];
    }
  }

  /** Search tags scoped to a specific dimension/scope */
  async searchTagsByScope(scope: TagScope, limit = 50): Promise<TagExtended[]> {
    const prefix = buildPrefix(scope);
    return this.searchTags(prefix, limit);
  }

  /** Find a tag by exact name */
  async findTagByName(name: string): Promise<TagView | null> {
    try {
      const results = await this.searchTags(name, 10);
      return results.find(t => (t.name?.toString() || '') === name) as TagView || null;
    } catch {
      return null;
    }
  }

  // ---------------------------------------------------------------------------
  // Resource tagging
  // ---------------------------------------------------------------------------

  /** Tag a ZB resource with one or more tags */
  async assignTag(resourceId: string, tagIds: string[]): Promise<void> {
    if (tagIds.length === 0) return;
    await this.clientApi.hydraClient
      .getResourceApi()
      .tagResource(
        new UUID(resourceId),
        tagIds.map(id => new UUID(id)),
      );
  }

  /** Remove a tag from a ZB resource */
  async removeTag(resourceId: string, tagId: string): Promise<void> {
    await this.clientApi.hydraClient
      .getResourceApi()
      .untagResource(new UUID(resourceId), new UUID(tagId));
  }

  /** Get all tags on a ZB resource */
  async getResourceTags(resourceId: string): Promise<TagView[]> {
    try {
      return await this.clientApi.hydraClient
        .getResourceApi()
        .getTagsForResource(new UUID(resourceId));
    } catch (err) {
      console.warn(`[SmeMartTag] Failed to get tags for resource ${resourceId}:`, err);
      return [];
    }
  }

  // ---------------------------------------------------------------------------
  // Display utilities
  // ---------------------------------------------------------------------------

  /** Strip prefix for display */
  getDisplayName(fullName: string): string {
    return stripPrefix(fullName);
  }

  /** Parse scope from a tag name */
  getScope(fullName: string): TagScope {
    return parseScope(fullName);
  }

  /** Build a prefix from scope parts */
  buildPrefix(scope: TagScope): string {
    return buildPrefix(scope);
  }

  // Re-export utilities for convenience
  readonly isSmeMartTag = isSmeMartTag;
  readonly isProtectedTag = isProtectedTag;
  readonly isOldConventionTag = isOldConventionTag;
  readonly parseHierarchyLevel = parseHierarchyLevel;

  // ---------------------------------------------------------------------------
  // Phase detection (engagement lifecycle)
  // ---------------------------------------------------------------------------

  /** Check if an engagement tag indicates active engagement phase */
  isEngagementPhase(tag: string | null | undefined): boolean {
    if (!tag) return false;
    return tag.toLowerCase().startsWith('sme-mart.eng.') || tag.startsWith('ENG-');
  }

  /** Check if a tag indicates RFP phase (sme-mart.rfp.* or no tag) */
  isRfpPhase(tag: string | null | undefined): boolean {
    if (!tag) return true;
    return tag.toLowerCase().startsWith('sme-mart.rfp.');
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  private getOrgId(): string | undefined {
    try {
      return this.app.getCurrentOrgId();
    } catch {
      return undefined;
    }
  }
}
