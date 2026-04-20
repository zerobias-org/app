/**
 * Demo Data Service — Pipeline-Based Seeding
 *
 * Seeds demo data via PipelineWriteService for all entity types:
 * - Engagements (corp-to-corp agreements)
 * - SmeMartProjects (scoped work under engagements)
 * - Bids, BidResponses, Notes, NoteFolders, Documents, ServiceOfferings, Reviews
 *
 * Data model updated 2026-03-24: Engagements are now corp-to-corp agreements.
 * Former "engagements" (crystal-harbor, etc.) are now SmeMartProjects.
 * Pinnacle Corp has 2 projects to demonstrate 1:many.
 */

import { Injectable, inject } from '@angular/core';
import { PipelineWriteService } from './pipeline-write.service';
import {
  DEMO_ENGAGEMENTS,
  DEMO_PROJECTS,
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
  seedDemoProjects,
} from '../../test-helpers/demo-data-seeder';

@Injectable({ providedIn: 'root' })
export class DemoDataService {
  private readonly pipelineWrite = inject(PipelineWriteService);

  /**
   * Master seeding function: Seeds all entity types in dependency order.
   *
   * Flow:
   * 1. Engagements (corp-to-corp agreements — root entity)
   * 2. SmeMartProjects (scoped work under engagements)
   * 3. Bids (linked to projects via engagementId field)
   * 4. BidResponses (linked to bids)
   * 5. ServiceOfferings (provider catalog, no dependencies)
   * 6. Notes (linked to projects via engagementId field)
   * 7. NoteFolders (linked to projects via engagementId field)
   * 8. Documents (linked to projects via engagementId field)
   * 9. Reviews (linked to projects via engagementId field)
   */
  async seedAllDemoData(): Promise<void> {
    console.info('⚡ Starting demo data seeding');

    // Step 1: Engagements (corp-to-corp agreements)
    await this.seedDemoEngagements();

    // Step 2: Projects (scoped work under engagements)
    await this.seedDemoProjects();

    // Extract project IDs for downstream seeders
    // (downstream entities reference project IDs via the engagementId field)
    const projectIds = DEMO_PROJECTS.map(p => p.id);
    const bidIds = seedDemoBids(projectIds).map(b => b.id);

    // Step 3: Bids (linked to projects)
    await this.seedDemoBids(projectIds);

    // Step 4: BidResponses (linked to bids)
    await this.seedDemoBidResponses(bidIds);

    // Step 5: ServiceOfferings (no dependencies)
    await this.seedDemoServiceOfferings();

    // Step 6: Notes (linked to projects)
    await this.seedDemoNotes(projectIds);

    // Step 7: NoteFolders (linked to projects)
    await this.seedDemoNoteFolders(projectIds);

    // Step 8: Documents (linked to projects)
    await this.seedDemoDocuments(projectIds);

    // Step 9: Reviews (linked to projects)
    await this.seedDemoReviews();

    console.info('✓ Demo data seeding complete.');
  }

  /**
   * Remove old demo data that used the pre-2026-03-24 model
   * (engagements that were actually projects: eng-001-crystal-harbor, etc.)
   */
  async removeOldDemoData(): Promise<void> {
    console.info('🧹 Removing old demo data (pre-Engagement/Project split)...');

    const oldEngagementIds = [
      'eng-001-crystal-harbor',
      'eng-002-velvet-summit',
      'eng-003-amber-circuit',
      'eng-004-silver-bridge',
      'eng-005-coral-meadow',
    ];

    // Old entities referenced old engagement IDs — these are now stale
    const oldBidIds = [
      'bid-001-gina-crystal',
      'bid-002-marcus-crystal',
      'bid-003-james-velvet',
      'bid-004-bob-amber',
      'bid-005-carlos-amber',
      'bid-006-alex-silver',
      'bid-007-gina-coral',
    ];

    const oldBidResponseIds = [
      'bidr-001-gina-crystal-req1',
      'bidr-002-gina-crystal-req2',
      'bidr-003-james-velvet-req1',
    ];

    const oldNoteIds = [
      'note-001-crystal-kickoff',
      'note-002-crystal-progress',
      'note-003-velvet-strategy',
      'note-004-silver-agenda',
      'note-005-coral-findings',
    ];

    const oldNoteFolderIds = [
      'folder-001-crystal',
      'folder-001-crystal-general',
      'folder-002-velvet',
      'folder-002-velvet-general',
      'folder-005-coral',
      'folder-005-coral-general',
    ];

    const oldDocIds = [
      'doc-001-crystal-scope',
      'doc-002-crystal-wip',
      'doc-003-velvet-plan',
    ];

    const oldReviewIds = [
      'review-001-gina-by-pinnacle',
      'review-002-james-by-fintech',
    ];

    const deletions: [string, string[]][] = [
      ['Review', oldReviewIds],
      ['SmeMartDocument', oldDocIds],
      ['NoteFolder', oldNoteFolderIds],
      ['Note', oldNoteIds],
      ['BidResponse', oldBidResponseIds],
      ['Bid', oldBidIds],
      ['Engagement', oldEngagementIds],
    ];

    for (const [className, ids] of deletions) {
      try {
        await this.pipelineWrite.deleteEntities(className as any, ids);
        console.info(`✓ Deleted ${ids.length} old ${className} entities`);
      } catch (err) {
        console.error(`Failed to delete old ${className} entities:`, err);
      }
    }

    console.info('🧹 Old demo data cleanup complete.');
  }

  async seedDemoEngagements(): Promise<void> {
    try {
      const data = DEMO_ENGAGEMENTS || [];
      if (data.length === 0) return;
      await this.pipelineWrite.pushEntities('Engagement', data, []);
      console.info(`✓ Seeded ${data.length} demo engagements (corp-to-corp agreements)`);
    } catch (err) {
      console.error('Failed to seed demo engagements:', err);
    }
  }

  async seedDemoProjects(): Promise<void> {
    try {
      const data = seedDemoProjects() || [];
      if (data.length === 0) return;
      await this.pipelineWrite.pushEntities('SmeMartProject', data, []);
      console.info(`✓ Seeded ${data.length} demo projects (scoped work)`);
    } catch (err) {
      console.error('Failed to seed demo projects:', err);
    }
  }

  async seedDemoBids(projectIds?: string[]): Promise<void> {
    try {
      const data = seedDemoBids(projectIds) || [];
      if (data.length === 0) return;
      await this.pipelineWrite.pushEntities('Bid', data, []);
      console.info(`✓ Seeded ${data.length} demo bids`);
    } catch (err) {
      console.error('Failed to seed demo bids:', err);
    }
  }

  async seedDemoBidResponses(bidIds?: string[]): Promise<void> {
    try {
      const data = seedDemoBidResponses(bidIds) || [];
      if (data.length === 0) return;
      await this.pipelineWrite.pushEntities('BidResponse', data, []);
      console.info(`✓ Seeded ${data.length} demo bid responses`);
    } catch (err) {
      console.error('Failed to seed demo bid responses:', err);
    }
  }

  async seedDemoNotes(projectIds?: string[]): Promise<void> {
    try {
      const data = seedDemoNotes(projectIds) || [];
      if (data.length === 0) return;
      await this.pipelineWrite.pushEntities('Note', data, []);
      console.info(`✓ Seeded ${data.length} demo notes`);
    } catch (err) {
      console.error('Failed to seed demo notes:', err);
    }
  }

  async seedDemoNoteFolders(projectIds?: string[]): Promise<void> {
    try {
      const data = seedDemoNoteFolders(projectIds) || [];
      if (data.length === 0) return;
      await this.pipelineWrite.pushEntities('NoteFolder', data, []);
      console.info(`✓ Seeded ${data.length} demo note folders`);
    } catch (err) {
      console.error('Failed to seed demo note folders:', err);
    }
  }

  async seedDemoDocuments(projectIds?: string[]): Promise<void> {
    try {
      const data = seedDemoDocuments(projectIds) || [];
      if (data.length === 0) return;
      await this.pipelineWrite.pushEntities('SmeMartDocument', data, []);
      console.info(`✓ Seeded ${data.length} demo documents`);
    } catch (err) {
      console.error('Failed to seed demo documents:', err);
    }
  }

  async seedDemoServiceOfferings(): Promise<void> {
    try {
      const data = seedDemoServiceOfferings() || [];
      if (data.length === 0) return;
      await this.pipelineWrite.pushEntities('ServiceOffering', data, []);
      console.info(`✓ Seeded ${data.length} demo service offerings`);
    } catch (err) {
      console.error('Failed to seed demo service offerings:', err);
    }
  }

  async seedDemoReviews(): Promise<void> {
    try {
      const data = seedDemoReviews() || [];
      if (data.length === 0) return;
      await this.pipelineWrite.pushEntities('Review', data, []);
      console.info(`✓ Seeded ${data.length} demo reviews`);
    } catch (err) {
      console.error('Failed to seed demo reviews:', err);
    }
  }
}
