import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { RfpWizardService } from './rfp-wizard.service';
import { EngagementsService } from '../../core/services/engagements.service';
import { DocumentService } from './document.service';
import { ImpersonationService } from './impersonation.service';
import { SmeMartTagService } from './sme-mart-tag.service';
import type { Engagement, RfpTaskGroup } from '../models';
import { makeEngagement, makeTaskGroups } from '../../test-helpers/factories';
import { TEST_ENG_ID, TEST_TAG_ID, TEST_USER_ID } from '../../test-helpers/constants';

type MockFn = ReturnType<typeof vi.fn>;

interface MockEngagements {
  createRfp: MockFn;
  updateRfp: MockFn;
  getEngagement: MockFn;
}

interface MockDocService {
  listDocuments: MockFn;
}

interface MockImpersonation {
  effectiveUserId: MockFn;
}

interface MockTagService {
  generateIdentifier: MockFn;
  generateRfpTag: MockFn;
  createTag: MockFn;
}

describe('RfpWizardService', () => {
  let service: RfpWizardService;
  let mockWorkRequests: MockEngagements;
  let mockDocService: MockDocService;
  let mockImpersonation: MockImpersonation;
  let mockTagService: MockTagService;

  const makeDraft = (overrides: Partial<Engagement> = {}) =>
    makeEngagement({ id: TEST_ENG_ID, status: 'draft', buyer_zerobias_user_id: TEST_USER_ID, ...overrides });

  beforeEach(() => {
    mockWorkRequests = {
      createRfp: vi.fn().mockResolvedValue(makeDraft()),
      updateRfp: vi.fn().mockResolvedValue(makeDraft()),
      getEngagement: vi.fn().mockResolvedValue(makeDraft()),
    };

    mockDocService = {
      listDocuments: vi.fn().mockResolvedValue([]),
    };

    mockImpersonation = {
      effectiveUserId: vi.fn().mockReturnValue(TEST_USER_ID),
    };

    mockTagService = {
      generateIdentifier: vi.fn().mockReturnValue('amber-circuit'),
      generateRfpTag: vi.fn().mockReturnValue('sme-mart.rfp.amber-circuit'),
      createTag: vi.fn().mockResolvedValue({ id: TEST_TAG_ID, name: 'sme-mart.rfp.amber-circuit' }),
    };

    TestBed.configureTestingModule({
      providers: [
        RfpWizardService,
        { provide: EngagementsService, useValue: mockWorkRequests },
        { provide: DocumentService, useValue: mockDocService },
        { provide: ImpersonationService, useValue: mockImpersonation },
        { provide: SmeMartTagService, useValue: mockTagService },
      ],
    });

    service = TestBed.inject(RfpWizardService);
  });

  // ---------------------------------------------------------------------------
  // Reset
  // ---------------------------------------------------------------------------

  describe('reset', () => {
    it('should clear all wizard state', () => {
      service.reset();
      expect(service.draft()).toBeNull();
      expect(service.draftId()).toBeNull();
      expect(service.currentStep()).toBe(0);
      expect(service.rfpData().title).toBe('');
      expect(service.documents()).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // Step 1: Basics — create new draft
  // ---------------------------------------------------------------------------

  describe('saveBasics (new draft)', () => {
    it('should create a work_requests row and persist wizard state', async () => {
      const id = await service.saveBasics({
        title: 'CDPH Security Audit',
        description: 'Comprehensive audit',
        category: 'government',
        budget_type: 'fixed',
        budget_min: '50000',
        budget_max: '100000',
        timeline: '6 months',
      });

      expect(id).toBe(TEST_ENG_ID);
      expect(mockWorkRequests.createRfp).toHaveBeenCalledTimes(1);
      expect(mockWorkRequests.createRfp).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'CDPH Security Audit',
          category: 'government',
          status: 'draft',
          buyer_zerobias_user_id: TEST_USER_ID,
        }),
      );

      // Wizard state persisted at step 1
      expect(mockWorkRequests.updateRfp).toHaveBeenCalledWith(
        TEST_ENG_ID,
        expect.objectContaining({ rfp_wizard_step: 1 }),
      );
      expect(service.currentStep()).toBe(1);
      expect(service.rfpData().title).toBe('CDPH Security Audit');
    });

    it('should set saving signal during operation', async () => {
      expect(service.saving()).toBe(false);
      const promise = service.saveBasics({
        title: 'Test',
        description: '',
        category: 'tech',
        budget_type: 'fixed',
        budget_min: '',
        budget_max: '',
        timeline: '',
      });
      // saving should be true during the async operation
      expect(service.saving()).toBe(true);
      await promise;
      expect(service.saving()).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Step 1: Basics — update existing draft
  // ---------------------------------------------------------------------------

  describe('saveBasics (existing draft)', () => {
    it('should update rather than create when draft exists', async () => {
      // Simulate an existing draft
      service.draft.set(makeDraft());

      await service.saveBasics({
        title: 'Updated Title',
        description: 'Updated desc',
        category: 'healthcare',
        budget_type: 'hourly',
        budget_min: '',
        budget_max: '',
        timeline: '',
      });

      expect(mockWorkRequests.createRfp).not.toHaveBeenCalled();
      expect(mockWorkRequests.updateRfp).toHaveBeenCalledWith(
        TEST_ENG_ID,
        expect.objectContaining({ title: 'Updated Title' }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Load draft (resume wizard)
  // ---------------------------------------------------------------------------

  describe('loadDraft', () => {
    it('should hydrate state from saved wizard data', async () => {
      const savedData = {
        title: 'Saved RFP',
        description: 'Saved desc',
        category: 'finance',
        budgetType: 'hourly',
        rfpTagIdentifier: 'coral-viper',
        documentIds: [],
        taskGroups: makeTaskGroups(),
        evaluationCriteria: [],
      };

      mockWorkRequests.getEngagement.mockResolvedValue({
        ...makeDraft(),
        rfp_wizard_data: savedData,
        rfp_wizard_step: 3,
      });

      await service.loadDraft(TEST_ENG_ID);

      expect(service.draft()?.id).toBe(TEST_ENG_ID);
      expect(service.rfpData().title).toBe('Saved RFP');
      expect(service.rfpData().taskGroups).toHaveLength(2);
      expect(service.currentStep()).toBe(3);
    });

    it('should throw when draft not found', async () => {
      mockWorkRequests.getEngagement.mockResolvedValue(null);
      await expect(service.loadDraft('nonexistent')).rejects.toThrow('not found');
    });

    it('should use empty defaults when no wizard data saved', async () => {
      mockWorkRequests.getEngagement.mockResolvedValue({
        ...makeDraft(),
        rfp_wizard_data: null,
        rfp_wizard_step: null,
      });

      await service.loadDraft(TEST_ENG_ID);

      expect(service.rfpData().title).toBe('');
      expect(service.rfpData().taskGroups).toEqual([]);
      expect(service.currentStep()).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Step 3: Requirements
  // ---------------------------------------------------------------------------

  describe('updateTaskGroups + saveRequirements', () => {
    it('should persist task groups to wizard data', async () => {
      service.draft.set(makeDraft());
      const groups = makeTaskGroups();

      service.updateTaskGroups(groups);
      expect(service.rfpData().taskGroups).toHaveLength(2);
      expect(service.rfpData().taskGroups[0].requirements).toHaveLength(2);

      await service.saveRequirements();
      expect(service.currentStep()).toBe(3);
      expect(mockWorkRequests.updateRfp).toHaveBeenCalledWith(
        TEST_ENG_ID,
        expect.objectContaining({ rfp_wizard_step: 3 }),
      );
    });

    it('should no-op when no draft exists', async () => {
      await service.saveRequirements();
      expect(mockWorkRequests.updateRfp).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Step 4: Terms
  // ---------------------------------------------------------------------------

  describe('updateTerms + saveTerms', () => {
    it('should merge terms into rfpData', async () => {
      service.draft.set(makeDraft());

      service.updateTerms({
        responseDeadline: '2026-04-01',
        questionsDeadline: '2026-03-25',
        confidentialityRequirements: 'NDA required',
        evaluationCriteria: [
          { name: 'Security', weight: 40, description: 'Security posture' },
          { name: 'Cost', weight: 30, description: 'Price competitiveness' },
          { name: 'Experience', weight: 30, description: 'Relevant experience' },
        ],
      });

      expect(service.rfpData().responseDeadline).toBe('2026-04-01');
      expect(service.rfpData().evaluationCriteria).toHaveLength(3);

      await service.saveTerms();
      expect(service.currentStep()).toBe(4);
    });
  });

  // ---------------------------------------------------------------------------
  // Step 5: Publish
  // ---------------------------------------------------------------------------

  describe('publishRfp', () => {
    it('should create tag and update work_request to open', async () => {
      service.draft.set(makeDraft());
      service.rfpData.update(d => ({
        ...d,
        title: 'CDPH Security Audit',
        rfpTagIdentifier: 'amber-circuit',
      }));

      await service.publishRfp();

      // Tag created
      expect(mockTagService.generateRfpTag).toHaveBeenCalledWith('amber-circuit');
      expect(mockTagService.createTag).toHaveBeenCalledWith(
        'sme-mart.rfp.amber-circuit',
        'RFP: CDPH Security Audit',
      );

      // Work request updated with tag + status
      expect(mockWorkRequests.updateRfp).toHaveBeenCalledWith(
        TEST_ENG_ID,
        expect.objectContaining({
          engagement_tag: 'sme-mart.rfp.amber-circuit',
          zerobias_tag_id: TEST_TAG_ID,
          status: 'open',
        }),
      );

      // Step advanced to 5
      expect(service.currentStep()).toBe(5);
    });

    it('should throw when no draft exists', async () => {
      await expect(service.publishRfp()).rejects.toThrow('No draft to publish');
    });

    it('should reset saving flag even on failure', async () => {
      service.draft.set(makeDraft());
      mockTagService.createTag.mockRejectedValue(new Error('Tag creation failed'));

      await expect(service.publishRfp()).rejects.toThrow('Tag creation failed');
      expect(service.saving()).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Full wizard flow: create → requirements → terms → publish
  // ---------------------------------------------------------------------------

  describe('full wizard flow', () => {
    it('should complete the entire create-to-publish lifecycle', async () => {
      // Step 1: Create draft
      const id = await service.saveBasics({
        title: 'CDPH Information Systems Modernization',
        description: 'Multi-year systems modernization project',
        category: 'government',
        budget_type: 'fixed',
        budget_min: '500000',
        budget_max: '2000000',
        timeline: '24 months',
      });
      expect(id).toBe(TEST_ENG_ID);
      expect(service.currentStep()).toBe(1);

      // Step 2: Documents (save step completion)
      await service.saveDocuments();
      expect(service.currentStep()).toBe(2);

      // Step 3: Add requirements
      service.updateTaskGroups(makeTaskGroups());
      await service.saveRequirements();
      expect(service.currentStep()).toBe(3);
      expect(service.rfpData().taskGroups).toHaveLength(2);

      // Total requirements across all groups
      const totalReqs = service.rfpData().taskGroups
        .reduce((sum, g) => sum + g.requirements.length, 0);
      expect(totalReqs).toBe(3);

      // Step 4: Terms
      service.updateTerms({
        responseDeadline: '2026-04-15',
        evaluationCriteria: [
          { name: 'Security', weight: 50, description: '' },
          { name: 'Cost', weight: 50, description: '' },
        ],
      });
      await service.saveTerms();
      expect(service.currentStep()).toBe(4);

      // Step 5: Publish
      await service.publishRfp();
      expect(service.currentStep()).toBe(5);

      // Verify the full call sequence
      expect(mockWorkRequests.createRfp).toHaveBeenCalledTimes(1);
      // updateRfp called: step1 persist + step2 persist + step3 persist + step4 persist + publish update + step5 persist = 6
      expect(mockWorkRequests.updateRfp).toHaveBeenCalled();
      expect(mockTagService.createTag).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------
  // Tag identifier
  // ---------------------------------------------------------------------------

  describe('updateTagIdentifier', () => {
    it('should update the rfpTagIdentifier in rfpData', () => {
      service.updateTagIdentifier('coral-viper');
      expect(service.rfpData().rfpTagIdentifier).toBe('coral-viper');
    });
  });

  // ---------------------------------------------------------------------------
  // Document handling
  // ---------------------------------------------------------------------------

  describe('onDocumentUploaded', () => {
    it('should add document to local state', async () => {
      const doc = {
        id: 'doc-1',
        engagement_id: TEST_ENG_ID,
        filename: 'exhibit-f.pdf',
        document_type: 'security_requirements',
      } as any;

      await service.onDocumentUploaded(doc);

      expect(service.documents()).toHaveLength(1);
      expect(service.rfpData().documentIds).toContain('doc-1');
    });
  });
});
