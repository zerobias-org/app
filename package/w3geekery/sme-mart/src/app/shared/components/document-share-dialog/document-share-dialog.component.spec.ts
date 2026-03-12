import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  DocumentShareDialog,
  type DocumentShareDialogData,
} from './document-share-dialog.component';
import { OrgDocumentService } from '../../../core/services/org-document.service';
import { WorkRequestsService } from '../../../core/services/work-requests.service';
import { SmeMartTagService } from '../../../core/services/sme-mart-tag.service';
import { makeOrgDocument } from '../../../test-helpers/factories';
import { TEST_DOC_ID, TEST_ORG_ID } from '../../../test-helpers/constants';

type MockFn = ReturnType<typeof vi.fn>;

interface MockOrgDocService {
  listShares: MockFn;
  shareDocument: MockFn;
}

interface MockWorkRequests {
  listEngagements: MockFn;
  searchEngagements: MockFn;
}

interface MockTagService {
  findTagByName: MockFn;
  assignTag: MockFn;
}

interface MockDialogRef {
  close: MockFn;
}

describe('DocumentShareDialog', () => {
  let component: DocumentShareDialog;
  let mockOrgDocService: MockOrgDocService;
  let mockWorkRequests: MockWorkRequests;
  let mockTagService: MockTagService;
  let mockDialogRef: MockDialogRef;

  const dialogData: DocumentShareDialogData = {
    document: makeOrgDocument(),
    orgId: TEST_ORG_ID,
  };

  beforeEach(() => {
    mockOrgDocService = {
      listShares: vi.fn().mockResolvedValue([]),
      shareDocument: vi.fn().mockResolvedValue({}),
    };

    mockWorkRequests = {
      listEngagements: vi.fn().mockResolvedValue({
        items: [
          { id: 'eng-001', title: 'CDPH Security Audit', status: 'in_progress' },
          { id: 'eng-002', title: 'DOJ Compliance Review', status: 'draft' },
        ],
      }),
      searchEngagements: vi.fn().mockResolvedValue({
        items: [{ id: 'eng-001', engagement_tag: 'sme-mart.eng.amber-circuit' }],
      }),
    };

    mockTagService = {
      findTagByName: vi.fn().mockResolvedValue({ id: 'tag-001', name: 'sme-mart.eng.amber-circuit' }),
      assignTag: vi.fn().mockResolvedValue(undefined),
    };

    mockDialogRef = {
      close: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [DocumentShareDialog],
      providers: [
        provideNoopAnimations(),
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: OrgDocumentService, useValue: mockOrgDocService },
        { provide: WorkRequestsService, useValue: mockWorkRequests },
        { provide: SmeMartTagService, useValue: mockTagService },
      ],
    });

    const fixture = TestBed.createComponent(DocumentShareDialog);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initial state', () => {
    it('should start loading', () => {
      expect(component.loading()).toBe(true);
    });

    it('should default visibility to all', () => {
      expect(component.visibility()).toBe('all');
    });

    it('should have zero selected count', () => {
      expect(component.selectedCount()).toBe(0);
    });
  });

  describe('ngOnInit', () => {
    it('should load engagements and existing shares', async () => {
      await component.ngOnInit();

      expect(mockWorkRequests.listEngagements).toHaveBeenCalledTimes(1);
      expect(mockOrgDocService.listShares).toHaveBeenCalledWith(TEST_DOC_ID);
      expect(component.targets()).toHaveLength(2);
      expect(component.loading()).toBe(false);
    });

    it('should mark already-shared engagements', async () => {
      mockOrgDocService.listShares.mockResolvedValue([
        { shared_with_type: 'engagement', shared_with_id: 'eng-001' },
      ]);

      await component.ngOnInit();

      const target1 = component.targets().find(t => t.id === 'eng-001');
      const target2 = component.targets().find(t => t.id === 'eng-002');
      expect(target1?.alreadyShared).toBe(true);
      expect(target2?.alreadyShared).toBe(false);
    });

    it('should handle load error gracefully', async () => {
      mockWorkRequests.listEngagements.mockRejectedValue(new Error('API error'));

      await component.ngOnInit();

      expect(component.loading()).toBe(false);
    });
  });

  describe('filteredTargets', () => {
    it('should filter by search query', async () => {
      await component.ngOnInit();

      component.searchQuery.set('cdph');
      expect(component.filteredTargets()).toHaveLength(1);
      expect(component.filteredTargets()[0].name).toBe('CDPH Security Audit');
    });

    it('should return all when query is empty', async () => {
      await component.ngOnInit();

      component.searchQuery.set('');
      expect(component.filteredTargets()).toHaveLength(2);
    });
  });

  describe('toggleTarget', () => {
    it('should toggle selected state', async () => {
      await component.ngOnInit();

      const target = component.targets()[0];
      component.toggleTarget(target);
      expect(component.targets()[0].selected).toBe(true);
      expect(component.selectedCount()).toBe(1);

      component.toggleTarget(component.targets()[0]);
      expect(component.targets()[0].selected).toBe(false);
      expect(component.selectedCount()).toBe(0);
    });
  });

  describe('selectedCount', () => {
    it('should not count already-shared items', async () => {
      mockOrgDocService.listShares.mockResolvedValue([
        { shared_with_type: 'engagement', shared_with_id: 'eng-001' },
      ]);

      await component.ngOnInit();

      // eng-001 is already shared — toggle it
      const target1 = component.targets().find(t => t.id === 'eng-001')!;
      component.toggleTarget(target1);

      // selectedCount should NOT include already-shared items even if "selected"
      expect(component.selectedCount()).toBe(0);
    });
  });

  describe('visibilityLabel', () => {
    it('should return human-readable labels', () => {
      component.visibility.set('all');
      expect(component.visibilityLabel()).toBe('All parties');

      component.visibility.set('buyer_only');
      expect(component.visibilityLabel()).toBe('Buyer only');

      component.visibility.set('provider_only');
      expect(component.visibilityLabel()).toBe('Provider only');
    });
  });

  describe('share', () => {
    it('should create shares for selected targets', async () => {
      await component.ngOnInit();

      // Select eng-002
      const target = component.targets().find(t => t.id === 'eng-002')!;
      component.toggleTarget(target);
      component.visibility.set('buyer_only');

      await component.share();

      expect(mockOrgDocService.shareDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          documentId: TEST_DOC_ID,
          targetType: 'engagement',
          targetId: 'eng-002',
          visibility: 'buyer_only',
        }),
      );
      expect(mockDialogRef.close).toHaveBeenCalledWith({ sharesCreated: 1 });
    });

    it('should no-op when nothing selected', async () => {
      await component.ngOnInit();
      await component.share();

      expect(mockOrgDocService.shareDocument).not.toHaveBeenCalled();
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should reset saving flag on error', async () => {
      await component.ngOnInit();

      const target = component.targets().find(t => t.id === 'eng-002')!;
      component.toggleTarget(target);
      mockOrgDocService.shareDocument.mockRejectedValue(new Error('Share failed'));

      await component.share();

      expect(component.saving()).toBe(false);
    });
  });

  describe('close', () => {
    it('should close dialog with null', () => {
      component.close();
      expect(mockDialogRef.close).toHaveBeenCalledWith(null);
    });
  });
});
