/**
 * Unit Tests for RfpWizardService (Plan 075 — backed by SmeMartProjectService)
 */

import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { RfpWizardService } from './rfp-wizard.service';
import { SmeMartProjectService } from './sme-mart-project.service';
import { DocumentService } from './document.service';
import { ImpersonationService } from './impersonation.service';
import { SmeMartTagService } from './sme-mart-tag.service';
import type { SmeMartProject, RfpTaskGroup } from '../models';
import { makeSmeMartProject, makeTaskGroups } from '../../test-helpers/factories';
import { TEST_ENG_ID, TEST_TAG_ID, TEST_USER_ID } from '../../test-helpers/constants';

type MockFn = ReturnType<typeof vi.fn>;

interface MockProjects {
  createAsRfp: MockFn;
  updateProject: MockFn;
  getProject: MockFn;
  publishRfp: MockFn;
}

describe('RfpWizardService (Plan 075)', () => {
  let service: RfpWizardService;
  let mockProjects: MockProjects;
  let mockDocService: { listDocuments: MockFn };
  let mockImpersonation: { effectiveUserId: MockFn };
  let mockTagService: { generateIdentifier: MockFn; generateRfpTag: MockFn; createTag: MockFn };

  const makeDraft = (overrides: Partial<SmeMartProject> = {}) =>
    makeSmeMartProject({ id: TEST_ENG_ID, status: 'draft', ...overrides });

  beforeEach(() => {
    mockProjects = {
      createAsRfp: vi.fn().mockResolvedValue(makeDraft()),
      updateProject: vi.fn().mockResolvedValue(makeDraft()),
      getProject: vi.fn().mockResolvedValue(makeDraft()),
      publishRfp: vi.fn().mockResolvedValue({ project: makeDraft({ status: 'published' }), rfpTagName: 'sme-mart.rfp.amber-circuit', zerobiasTagId: TEST_TAG_ID }),
    };

    mockDocService = { listDocuments: vi.fn().mockResolvedValue([]) };
    mockImpersonation = { effectiveUserId: vi.fn().mockReturnValue(TEST_USER_ID) };
    mockTagService = {
      generateIdentifier: vi.fn().mockReturnValue('amber-circuit'),
      generateRfpTag: vi.fn().mockReturnValue('sme-mart.rfp.amber-circuit'),
      createTag: vi.fn().mockResolvedValue({ id: TEST_TAG_ID, name: 'sme-mart.rfp.amber-circuit' }),
    };

    TestBed.configureTestingModule({
      providers: [
        RfpWizardService,
        { provide: SmeMartProjectService, useValue: mockProjects },
        { provide: DocumentService, useValue: mockDocService },
        { provide: ImpersonationService, useValue: mockImpersonation },
        { provide: SmeMartTagService, useValue: mockTagService },
      ],
    });

    service = TestBed.inject(RfpWizardService);
  });

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

  describe('saveBasics (new draft)', () => {
    it('should create SmeMartProject via createAsRfp and persist wizard state', async () => {
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
      expect(mockProjects.createAsRfp).toHaveBeenCalledTimes(1);
      expect(mockProjects.createAsRfp).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'CDPH Security Audit',
          category: 'government',
        }),
      );

      // Wizard state persisted at step 1
      expect(mockProjects.updateProject).toHaveBeenCalledWith(
        TEST_ENG_ID,
        expect.objectContaining({ wizardStep: '1' }),
      );
      expect(service.currentStep()).toBe(1);
      expect(service.rfpData().title).toBe('CDPH Security Audit');
    });

    it('should set saving signal during operation', async () => {
      expect(service.saving()).toBe(false);
      const promise = service.saveBasics({
        title: 'Test', description: '', category: 'tech',
        budget_type: 'fixed', budget_min: '', budget_max: '', timeline: '',
      });
      expect(service.saving()).toBe(true);
      await promise;
      expect(service.saving()).toBe(false);
    });
  });

  describe('saveBasics (existing draft)', () => {
    it('should update rather than create when draft exists', async () => {
      service.draft.set(makeDraft());

      await service.saveBasics({
        title: 'Updated Title', description: 'Updated desc', category: 'healthcare',
        budget_type: 'hourly', budget_min: '', budget_max: '', timeline: '',
      });

      expect(mockProjects.createAsRfp).not.toHaveBeenCalled();
      expect(mockProjects.updateProject).toHaveBeenCalledWith(
        TEST_ENG_ID,
        expect.objectContaining({ name: 'Updated Title' }),
      );
    });
  });

  describe('loadDraft', () => {
    it('should hydrate state from saved wizard data', async () => {
      const savedData = {
        title: 'Saved RFP', description: 'Saved desc', category: 'finance',
        budgetType: 'hourly', rfpTagIdentifier: 'coral-viper',
        documentIds: [], taskGroups: makeTaskGroups(), evaluationCriteria: [],
      };

      mockProjects.getProject.mockResolvedValue(makeDraft({
        wizardData: savedData as any,
        wizardStep: '3',
      }));

      await service.loadDraft(TEST_ENG_ID);

      expect(service.draft()?.id).toBe(TEST_ENG_ID);
      expect(service.rfpData().title).toBe('Saved RFP');
      expect(service.rfpData().taskGroups).toHaveLength(2);
      expect(service.currentStep()).toBe(3);
    });

    it('should throw when draft not found', async () => {
      mockProjects.getProject.mockResolvedValue(null);
      await expect(service.loadDraft('nonexistent')).rejects.toThrow('not found');
    });
  });

  describe('updateTaskGroups + saveRequirements', () => {
    it('should persist task groups to wizard data', async () => {
      service.draft.set(makeDraft());
      const groups = makeTaskGroups();

      service.updateTaskGroups(groups);
      expect(service.rfpData().taskGroups).toHaveLength(2);

      await service.saveRequirements();
      expect(service.currentStep()).toBe(3);
      expect(mockProjects.updateProject).toHaveBeenCalledWith(
        TEST_ENG_ID,
        expect.objectContaining({ wizardStep: '3' }),
      );
    });
  });

  describe('updateTerms + saveTerms', () => {
    it('should merge terms into rfpData and persist deadlines to project', async () => {
      service.draft.set(makeDraft());

      service.updateTerms({
        responseDeadline: '2026-04-01',
        questionsDeadline: '2026-03-25',
        evaluationCriteria: [
          { name: 'Security', weight: 40, description: 'Security posture' },
        ],
      });

      expect(service.rfpData().responseDeadline).toBe('2026-04-01');

      await service.saveTerms();
      expect(service.currentStep()).toBe(4);
      // Should persist deadline fields to SmeMartProject
      expect(mockProjects.updateProject).toHaveBeenCalledWith(
        TEST_ENG_ID,
        expect.objectContaining({ responseDeadline: '2026-04-01' }),
      );
    });
  });

  describe('publishRfp', () => {
    it('should call SmeMartProjectService.publishRfp', async () => {
      service.draft.set(makeDraft());
      service.rfpData.update(d => ({
        ...d, title: 'CDPH Security Audit', rfpTagIdentifier: 'amber-circuit',
      }));

      await service.publishRfp();

      expect(mockProjects.publishRfp).toHaveBeenCalledWith(TEST_ENG_ID, 'amber-circuit');
      expect(service.currentStep()).toBe(5);
    });

    it('should throw when no draft exists', async () => {
      await expect(service.publishRfp()).rejects.toThrow('No draft to publish');
    });
  });

  describe('updateTagIdentifier', () => {
    it('should update the rfpTagIdentifier in rfpData', () => {
      service.updateTagIdentifier('coral-viper');
      expect(service.rfpData().rfpTagIdentifier).toBe('coral-viper');
    });
  });

  describe('onDocumentUploaded', () => {
    it('should add document to local state', async () => {
      const doc = { id: 'doc-1', engagement_id: TEST_ENG_ID, filename: 'exhibit-f.pdf' } as any;
      await service.onDocumentUploaded(doc);
      expect(service.documents()).toHaveLength(1);
      expect(service.rfpData().documentIds).toContain('doc-1');
    });
  });
});
