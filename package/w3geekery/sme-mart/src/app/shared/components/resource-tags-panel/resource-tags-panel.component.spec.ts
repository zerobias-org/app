import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ResourceTagsPanel } from './resource-tags-panel.component';
import { EngagementHierarchyService } from '../../../core/services/engagement-hierarchy.service';
import { makeTag } from '../../../test-helpers/factories';

describe('ResourceTagsPanel', () => {
  let component: ResourceTagsPanel;
  let mockHierarchyService: {
    getResourceTags: ReturnType<typeof vi.fn>;
    untagResource: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockHierarchyService = {
      getResourceTags: vi.fn().mockResolvedValue([
        makeTag('sme-mart.eng.amber-circuit', 'tag-eng'),
        makeTag('custom-tag', 'tag-custom'),
      ]),
      untagResource: vi.fn().mockResolvedValue(undefined),
    };

    TestBed.configureTestingModule({
      imports: [ResourceTagsPanel],
      providers: [
        provideNoopAnimations(),
        { provide: EngagementHierarchyService, useValue: mockHierarchyService },
      ],
    });

    const fixture = TestBed.createComponent(ResourceTagsPanel);
    component = fixture.componentInstance;
    component.resourceId = 'res-001';
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('list', () => {
    it('should load tags', async () => {
      await component.list();
      expect(mockHierarchyService.getResourceTags).toHaveBeenCalledWith('res-001');
      expect(component.tags()).toHaveLength(2);
    });

    it('should skip when no resourceId', async () => {
      component.resourceId = '';
      await component.list();
      expect(mockHierarchyService.getResourceTags).not.toHaveBeenCalled();
    });

    it('should set loading flag', async () => {
      expect(component.loading()).toBe(false);
      const promise = component.list();
      expect(component.loading()).toBe(true);
      await promise;
      expect(component.loading()).toBe(false);
    });
  });

  describe('isProtected', () => {
    it('should detect protected sme-mart hierarchy tags', () => {
      expect(component.isTagProtected(makeTag('sme-mart.eng.amber-circuit'))).toBe(true);
      expect(component.isTagProtected(makeTag('sme-mart.proj.blue-wave'))).toBe(true);
    });

    it('should detect protected old-convention tags', () => {
      expect(component.isTagProtected(makeTag('ENG-amber-circuit'))).toBe(true);
    });

    it('should allow non-hierarchy tags', () => {
      expect(component.isTagProtected(makeTag('custom-tag'))).toBe(false);
    });
  });

  describe('onRemoveTag', () => {
    it('should call untagResource for non-protected tags', async () => {
      const tag = makeTag('custom-tag', 'tag-custom');
      await component.onRemoveTag(tag);
      expect(mockHierarchyService.untagResource).toHaveBeenCalledWith('res-001', 'tag-custom');
    });

    it('should reload tags after removal', async () => {
      const tag = makeTag('custom-tag', 'tag-custom');
      await component.onRemoveTag(tag);
      // getResourceTags called once for the reload after removal
      expect(mockHierarchyService.getResourceTags).toHaveBeenCalled();
    });

    it('should skip removal for protected tags', async () => {
      const tag = makeTag('sme-mart.eng.amber-circuit', 'tag-eng');
      await component.onRemoveTag(tag);
      expect(mockHierarchyService.untagResource).not.toHaveBeenCalled();
    });

    it('should emit tagsChanged after removal', async () => {
      const spy = vi.spyOn(component.tagsChanged, 'emit');
      const tag = makeTag('custom-tag', 'tag-custom');
      await component.onRemoveTag(tag);
      expect(spy).toHaveBeenCalled();
    });

    it('should handle removal errors without crashing', async () => {
      mockHierarchyService.untagResource.mockRejectedValue(new Error('API error'));
      const tag = makeTag('custom-tag', 'tag-custom');
      // Should not throw
      await component.onRemoveTag(tag);
    });
  });

  describe('helper methods', () => {
    it('should extract tag description', () => {
      const tag = makeTag('foo');
      expect(component.tagDescription(tag)).toBe('Tag: foo');
    });

    it('should handle empty description', () => {
      expect(component.tagDescription({ name: 'foo' } as any)).toBe('');
    });
  });
});
