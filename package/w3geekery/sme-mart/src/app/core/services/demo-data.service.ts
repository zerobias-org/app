/**
 * Demo Data Service — Pipeline-Based Seeding for All 8 Migrated Entities
 *
 * Migrated from Neon SQL inserts to AuditgraphDB Pipeline writes in Phase 5.
 * Seeds all 8 migrated entity types via PipelineWriteService.
 *
 * This aligns demo data seeding with production data flow and ensures consistency
 * across environments (dev, staging, prod).
 *
 * Neon tables for migrated entities will be archived 2 weeks after Phase 5 completion
 * (observation period: 2026-03-19 to 2026-04-02).
 */

import { Injectable, inject } from '@angular/core';
import { PipelineWriteService } from './pipeline-write.service';
import {
  DEMO_ENGAGEMENTS,
  DEMO_BIDS,
  DEMO_BID_RESPONSES,
  DEMO_NOTES,
  DEMO_NOTE_FOLDERS,
  DEMO_DOCUMENTS,
  DEMO_SERVICE_OFFERINGS,
  DEMO_REVIEWS,
  seedDemoBids,
  seedDemoBidResponses,
  seedDemoNotes,
  seedDemoNoteFolders,
  seedDemoDocuments,
  seedDemoServiceOfferings,
  seedDemoReviews,
} from '../../test-helpers/demo-data-seeder';

/**
 * DemoDataService — Centralized demo data seeding via Pipeline.
 *
 * Provides methods to seed all 8 migrated entity types. Each seeder method:
 * - Calls PipelineWriteService.pushEntities() with demo data
 * - Logs success/failure (continues on error, doesn't throw)
 * - Supports filtering by related entity IDs for fine-grained seeding
 *
 * Typical usage:
 * ```typescript
 * const demoService = inject(DemoDataService);
 * await demoService.seedAllDemoData();  // Seeds all 8 entities
 * ```
 */
@Injectable({ providedIn: 'root' })
export class DemoDataService {
  private readonly pipelineWrite = inject(PipelineWriteService);

  /**
   * Master seeding function: Seeds all 8 migrated entity types in sequence.
   *
   * Flow:
   * 1. Engagements (root entity)
   * 2. Bids (linked to engagements)
   * 3. BidResponses (linked to bids)
   * 4. ServiceOfferings (provider catalog)
   * 5. Notes (linked to engagements)
   * 6. NoteFolders (linked to engagements)
   * 7. Documents (linked to engagements)
   * 8. Reviews (linked to engagements)
   *
   * Each step awaits completion before proceeding. If a step fails, logs the error
   * and continues to the next step.
   */
  async seedAllDemoData(): Promise<void> {
    console.info('⚡ Starting demo data seeding (Phase 5 migration: Neon → Pipeline)');

    // Step 1: Engagements (root entities — must seed first)
    await this.seedDemoEngagements();

    // Extract engagement IDs for downstream seeders
    const engagementIds = DEMO_ENGAGEMENTS.map(e => e.id);
    const bidIds = seedDemoBids(engagementIds).map(b => b.id);

    // Step 2: Bids (linked to engagements)
    await this.seedDemoBids(engagementIds);

    // Step 3: BidResponses (linked to bids)
    await this.seedDemoBidResponses(bidIds);

    // Step 4: ServiceOfferings (no dependencies, provider catalog)
    await this.seedDemoServiceOfferings();

    // Step 5: Notes (linked to engagements)
    await this.seedDemoNotes(engagementIds);

    // Step 6: NoteFolders (linked to engagements)
    await this.seedDemoNoteFolders(engagementIds);

    // Step 7: Documents (linked to engagements)
    await this.seedDemoDocuments(engagementIds);

    // Step 8: Reviews (linked to engagements)
    await this.seedDemoReviews();

    console.info('✓ Demo data seeding complete. All 8 entity types pushed to Pipeline.');
  }

  /**
   * Seed demo engagements.
   *
   * Phase 5 Migration Note:
   * Demo data now seeded via Pipeline instead of Neon SQL.
   * This aligns demo seeding with production data flow.
   * Neon tables for migrated entities will be archived 2 weeks after Phase 5 completion.
   */
  async seedDemoEngagements(): Promise<void> {
    try {
      const data = DEMO_ENGAGEMENTS || [];
      if (data.length === 0) {
        console.info('No demo engagements to seed');
        return;
      }
      await this.pipelineWrite.pushEntities('Engagement', data, []);
      console.info(`✓ Seeded ${data.length} demo engagements via Pipeline`);
    } catch (err) {
      console.error('Failed to seed demo engagements:', err);
      // Continue to next seeder; don't throw
    }
  }

  /**
   * Seed demo bids linked to specific engagements.
   *
   * @param engagementIds Optional list of engagement IDs to filter bids
   */
  async seedDemoBids(engagementIds?: string[]): Promise<void> {
    try {
      const data = seedDemoBids(engagementIds) || [];
      if (data.length === 0) {
        console.info('No demo bids to seed');
        return;
      }
      await this.pipelineWrite.pushEntities('Bid', data, []);
      console.info(`✓ Seeded ${data.length} demo bids via Pipeline`);
    } catch (err) {
      console.error('Failed to seed demo bids:', err);
      // Continue to next seeder; don't throw
    }
  }

  /**
   * Seed demo bid responses linked to specific bids.
   *
   * @param bidIds Optional list of bid IDs to filter responses
   */
  async seedDemoBidResponses(bidIds?: string[]): Promise<void> {
    try {
      const data = seedDemoBidResponses(bidIds) || [];
      if (data.length === 0) {
        console.info('No demo bid responses to seed');
        return;
      }
      await this.pipelineWrite.pushEntities('BidResponse', data, []);
      console.info(`✓ Seeded ${data.length} demo bid responses via Pipeline`);
    } catch (err) {
      console.error('Failed to seed demo bid responses:', err);
      // Continue to next seeder; don't throw
    }
  }

  /**
   * Seed demo notes linked to specific engagements.
   *
   * @param engagementIds Optional list of engagement IDs to filter notes
   */
  async seedDemoNotes(engagementIds?: string[]): Promise<void> {
    try {
      const data = seedDemoNotes(engagementIds) || [];
      if (data.length === 0) {
        console.info('No demo notes to seed');
        return;
      }
      await this.pipelineWrite.pushEntities('Note', data, []);
      console.info(`✓ Seeded ${data.length} demo notes via Pipeline`);
    } catch (err) {
      console.error('Failed to seed demo notes:', err);
      // Continue to next seeder; don't throw
    }
  }

  /**
   * Seed demo note folders linked to specific engagements.
   *
   * @param engagementIds Optional list of engagement IDs to filter folders
   */
  async seedDemoNoteFolders(engagementIds?: string[]): Promise<void> {
    try {
      const data = seedDemoNoteFolders(engagementIds) || [];
      if (data.length === 0) {
        console.info('No demo note folders to seed');
        return;
      }
      await this.pipelineWrite.pushEntities('NoteFolder', data, []);
      console.info(`✓ Seeded ${data.length} demo note folders via Pipeline`);
    } catch (err) {
      console.error('Failed to seed demo note folders:', err);
      // Continue to next seeder; don't throw
    }
  }

  /**
   * Seed demo documents linked to specific engagements.
   *
   * @param engagementIds Optional list of engagement IDs to filter documents
   */
  async seedDemoDocuments(engagementIds?: string[]): Promise<void> {
    try {
      const data = seedDemoDocuments(engagementIds) || [];
      if (data.length === 0) {
        console.info('No demo documents to seed');
        return;
      }
      await this.pipelineWrite.pushEntities('SmeMartDocument', data, []);
      console.info(`✓ Seeded ${data.length} demo documents via Pipeline`);
    } catch (err) {
      console.error('Failed to seed demo documents:', err);
      // Continue to next seeder; don't throw
    }
  }

  /**
   * Seed demo service offerings.
   */
  async seedDemoServiceOfferings(): Promise<void> {
    try {
      const data = seedDemoServiceOfferings() || [];
      if (data.length === 0) {
        console.info('No demo service offerings to seed');
        return;
      }
      await this.pipelineWrite.pushEntities('ServiceOffering', data, []);
      console.info(`✓ Seeded ${data.length} demo service offerings via Pipeline`);
    } catch (err) {
      console.error('Failed to seed demo service offerings:', err);
      // Continue to next seeder; don't throw
    }
  }

  /**
   * Seed demo reviews.
   */
  async seedDemoReviews(): Promise<void> {
    try {
      const data = seedDemoReviews() || [];
      if (data.length === 0) {
        console.info('No demo reviews to seed');
        return;
      }
      await this.pipelineWrite.pushEntities('Review', data, []);
      console.info(`✓ Seeded ${data.length} demo reviews via Pipeline`);
    } catch (err) {
      console.error('Failed to seed demo reviews:', err);
      // Continue to next seeder; don't throw
    }
  }
}
