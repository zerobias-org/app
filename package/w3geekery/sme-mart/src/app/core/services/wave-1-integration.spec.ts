/**
 * Wave 1 Integration Test (Plan 075 — SmeMartProject + Bid flow)
 *
 * Simulates end-to-end flow: create project → submit bid → list bids.
 * Verifies services work together via mocked Pipeline/GraphQL.
 */

import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { SmeMartProjectService } from './sme-mart-project.service';
import { BidsService } from './bids.service';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService } from './graphql-read.service';
import { NotificationService } from './notification.service';
import { SmeMartTagService } from './sme-mart-tag.service';
import { SmeMartResourceService } from './sme-mart-resource.service';
import { BID_GQL_FIXTURE } from '../../test-helpers/gql-fixtures';
import { fakePipelineWriteService, fakeGraphqlReadService, fakeSmeMartTagService, fakeNotificationService } from '../../test-helpers/angular';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Wave 1 Integration: SmeMartProject → Bid Flow (Plan 075)', () => {
  let projectService: SmeMartProjectService;
  let bidsService: BidsService;
  let pipelineWrite: ReturnType<typeof fakePipelineWriteService>;
  let graphqlRead: ReturnType<typeof fakeGraphqlReadService>;

  beforeEach(() => {
    pipelineWrite = fakePipelineWriteService();
    graphqlRead = fakeGraphqlReadService();

    TestBed.configureTestingModule({
      providers: [
        SmeMartProjectService,
        BidsService,
        { provide: PipelineWriteService, useValue: pipelineWrite },
        { provide: GraphqlReadService, useValue: graphqlRead },
        { provide: NotificationService, useValue: fakeNotificationService() },
        { provide: SmeMartTagService, useValue: fakeSmeMartTagService() },
        { provide: SmeMartResourceService, useValue: { linkResources: vi.fn().mockResolvedValue(undefined) } },
      ],
    });

    projectService = TestBed.inject(SmeMartProjectService);
    bidsService = TestBed.inject(BidsService);
  });

  it('should complete flow: create project → submit bid → list bids', async () => {
    // 1. Create RFP project
    const project = await projectService.createAsRfp({
      name: 'HIPAA Compliance Audit',
      category: 'compliance',
      budgetMin: 10000,
      budgetMax: 25000,
    });

    expect(project).toBeDefined();
    expect(project.id).toBeDefined();
    expect(project.name).toBe('HIPAA Compliance Audit');
    expect(project.status).toBe('draft');

    // Verify Pipeline was called
    expect(pipelineWrite.pushEntity).toHaveBeenCalledWith(
      'SmeMartProject',
      expect.objectContaining({ name: 'HIPAA Compliance Audit' }),
    );

    // Mock getById to return the created project (submitBid needs to fetch it)
    graphqlRead.getById.mockResolvedValue({
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      category: project.category,
      budgetMin: project.budgetMin,
      budgetMax: project.budgetMax,
      dateCreated: project.createdAt,
      dateLastModified: project.updatedAt,
    });

    // 2. Submit bid on project
    const submittedBid = await bidsService.submitBid({
      project_id: project.id,
      provider_id: 'provider-001',
      cover_letter: 'We can help',
      proposed_price: '15000',
      proposed_timeline: '30 days',
    });

    expect(submittedBid).toBeDefined();
    expect(submittedBid.id).toBeDefined();
    expect(submittedBid.project_id).toBe(project.id);
    expect(submittedBid.status).toBe('pending');

    // Verify Pipeline was called for bid
    expect(pipelineWrite.pushEntity).toHaveBeenCalledWith(
      'Bid',
      expect.objectContaining({ coverLetter: 'We can help' }),
    );

    // 3. Verify Pipeline was called twice (project + bid)
    expect(pipelineWrite.pushEntity).toHaveBeenCalledTimes(2);
  });

  it('should handle bid wizard flow: draft → save → submit', async () => {
    // Create draft bid
    const draft = await bidsService.createDraft('proj-001', 'provider-001');
    expect(draft.status).toBe('draft');
    expect(draft.project_id).toBe('proj-001');
    expect(draft.wizard_step).toBe(0);

    // Save progress
    const wizardData = {
      approach: { executive_summary: 'Summary' },
      pricing: { proposed_price: '7500', total_estimated_hours: 40 },
    };

    // Mock getById for saveDraft
    graphqlRead.getById.mockResolvedValue({
      id: draft.id,
      providerId: draft.provider_id!,
      status: 'DRAFT',
      wizardStep: 0,
      createdAt: draft.created_at,
      updatedAt: draft.updated_at,
    });
    const saved = await bidsService.saveDraft(draft.id, wizardData, 2);
    expect(saved.wizard_step).toBe(2);
    expect(saved.proposed_price).toBe('7500');

    // Mock for submitDraft
    graphqlRead.getById.mockResolvedValue({
      id: draft.id,
      providerId: draft.provider_id!,
      proposedPrice: '7500',
      totalEstimatedHours: 40,
      status: 'DRAFT',
      wizardStep: 2,
      createdAt: draft.created_at,
      updatedAt: new Date().toISOString(),
    });

    // Submit
    const submitted = await bidsService.submitDraft(draft.id);
    expect(submitted.status).toBe('pending');
    expect(submitted.wizard_data).toBeNull();

    // create + save + submit = 3 pipeline pushes
    expect(pipelineWrite.pushEntity).toHaveBeenCalledTimes(3);
  });
});
