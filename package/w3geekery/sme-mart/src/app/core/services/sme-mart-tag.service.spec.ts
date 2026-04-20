import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { SmeMartTagService } from './sme-mart-tag.service';
import { ZerobiasClientApi, ZerobiasClientApp } from '@zerobias-com/zerobias-client';
import { TEST_ORG_ID, TEST_TAG_ID, TEST_TAG_ID_2, TEST_RESOURCE_ID } from '../../test-helpers/constants';

describe('SmeMartTagService', () => {
  let service: SmeMartTagService;
  let mockCreateTag: ReturnType<typeof vi.fn>;
  let mockSearchTags: ReturnType<typeof vi.fn>;
  let mockTagResource: ReturnType<typeof vi.fn>;
  let mockUntagResource: ReturnType<typeof vi.fn>;
  let mockGetTagsForResource: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockCreateTag = vi.fn().mockResolvedValue({ id: TEST_TAG_ID, name: 'sme-mart.eng.amber-circuit' });
    mockSearchTags = vi.fn().mockResolvedValue({ items: [] });
    mockTagResource = vi.fn().mockResolvedValue(undefined);
    mockUntagResource = vi.fn().mockResolvedValue(undefined);
    mockGetTagsForResource = vi.fn().mockResolvedValue([]);

    const mockClientApi = {
      hydraClient: {
        getTagApi: () => ({
          createTag: mockCreateTag,
          searchTags: mockSearchTags,
        }),
        getResourceApi: () => ({
          tagResource: mockTagResource,
          untagResource: mockUntagResource,
          getTagsForResource: mockGetTagsForResource,
        }),
      },
    };

    const mockApp = {
      getCurrentOrgId: () => TEST_ORG_ID,
    };

    TestBed.configureTestingModule({
      providers: [
        SmeMartTagService,
        { provide: ZerobiasClientApi, useValue: mockClientApi },
        { provide: ZerobiasClientApp, useValue: mockApp },
      ],
    });

    service = TestBed.inject(SmeMartTagService);
  });

  // -------------------------------------------------------------------------
  // Tag generation
  // -------------------------------------------------------------------------

  describe('generateIdentifier', () => {
    it('should return word-word format', () => {
      const id = service.generateIdentifier();
      expect(id).toMatch(/^[a-z]+-[a-z]+$/);
    });

    it('should not repeat the same word', () => {
      for (let i = 0; i < 20; i++) {
        const id = service.generateIdentifier();
        const [w1, w2] = id.split('-');
        expect(w1).not.toBe(w2);
      }
    });
  });

  describe('generateEngagementTag', () => {
    it('should produce sme-mart.eng.word-word', () => {
      expect(service.generateEngagementTag()).toMatch(/^sme-mart\.eng\.[a-z]+-[a-z]+$/);
    });
  });

  describe('generateProjectTag', () => {
    it('should produce sme-mart.proj.word-word', () => {
      expect(service.generateProjectTag()).toMatch(/^sme-mart\.proj\.[a-z]+-[a-z]+$/);
    });
  });

  describe('generateTaskTag', () => {
    it('should produce sme-mart.task.word-word', () => {
      expect(service.generateTaskTag()).toMatch(/^sme-mart\.task\.[a-z]+-[a-z]+$/);
    });
  });

  describe('generateRfpTag', () => {
    it('should produce sme-mart.rfp.word-word with custom identifier', () => {
      expect(service.generateRfpTag('coral-viper')).toBe('sme-mart.rfp.coral-viper');
    });

    it('should produce sme-mart.rfp.word-word with generated identifier', () => {
      expect(service.generateRfpTag()).toMatch(/^sme-mart\.rfp\.[a-z]+-[a-z]+$/);
    });
  });

  describe('generateUniqueTag', () => {
    it('should avoid existing names', () => {
      const existing = [service.generateEngagementTag()];
      const tag = service.generateUniqueTag('eng', existing);
      expect(existing).not.toContain(tag);
      expect(tag).toMatch(/^sme-mart\.eng\./);
    });
  });

  // -------------------------------------------------------------------------
  // Tag CRUD (hydraClient)
  // -------------------------------------------------------------------------

  describe('createTag', () => {
    it('should call hydraClient.Tag.createTag', async () => {
      await service.createTag('sme-mart.eng.amber-circuit', 'Test engagement');
      expect(mockCreateTag).toHaveBeenCalledTimes(1);
      const body = mockCreateTag.mock.calls[0][0];
      expect(body.name).toBe('sme-mart.eng.amber-circuit');
    });

    it('should return null on failure', async () => {
      mockCreateTag.mockRejectedValue(new Error('API error'));
      const result = await service.createTag('sme-mart.eng.fail');
      expect(result).toBeNull();
    });
  });

  describe('createEngagementTag', () => {
    it('should create tag with generated name', async () => {
      const result = await service.createEngagementTag('Test');
      expect(mockCreateTag).toHaveBeenCalledTimes(1);
      expect(result).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------------
  // Tag search (hydraClient)
  // -------------------------------------------------------------------------

  describe('searchTags', () => {
    it('should call hydraClient searchTags', async () => {
      await service.searchTags('sme-mart.eng.');
      expect(mockSearchTags).toHaveBeenCalledTimes(1);
    });

    it('should return empty array on failure', async () => {
      mockSearchTags.mockRejectedValue(new Error('API error'));
      const result = await service.searchTags('sme-mart.eng.');
      expect(result).toEqual([]);
    });
  });

  describe('findTagByName', () => {
    it('should return matching tag by exact name', async () => {
      const tag = { id: TEST_TAG_ID, name: 'sme-mart.eng.amber-circuit' };
      mockSearchTags.mockResolvedValue({ items: [tag] });
      const result = await service.findTagByName('sme-mart.eng.amber-circuit');
      expect(result).toEqual(tag as any);
    });

    it('should return null when no exact match', async () => {
      mockSearchTags.mockResolvedValue({ items: [{ id: TEST_TAG_ID_2, name: 'sme-mart.eng.other' }] });
      const result = await service.findTagByName('sme-mart.eng.amber-circuit');
      expect(result).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Resource tagging (hydraClient)
  // -------------------------------------------------------------------------

  describe('assignTag', () => {
    it('should call tagResource with resource and tag IDs', async () => {
      await service.assignTag(TEST_RESOURCE_ID, [TEST_TAG_ID, TEST_TAG_ID_2]);
      expect(mockTagResource).toHaveBeenCalledTimes(1);
    });

    it('should skip if no tag IDs', async () => {
      await service.assignTag(TEST_RESOURCE_ID, []);
      expect(mockTagResource).not.toHaveBeenCalled();
    });
  });

  describe('removeTag', () => {
    it('should call untagResource', async () => {
      await service.removeTag(TEST_RESOURCE_ID, TEST_TAG_ID);
      expect(mockUntagResource).toHaveBeenCalledTimes(1);
    });
  });

  describe('getResourceTags', () => {
    it('should return tags for a resource', async () => {
      const tags = [{ id: TEST_TAG_ID, name: 'sme-mart.eng.amber-circuit' }];
      mockGetTagsForResource.mockResolvedValue(tags);
      const result = await service.getResourceTags(TEST_RESOURCE_ID);
      expect(result).toEqual(tags);
    });

    it('should return empty array on failure', async () => {
      mockGetTagsForResource.mockRejectedValue(new Error('API error'));
      const result = await service.getResourceTags(TEST_RESOURCE_ID);
      expect(result).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // Display utilities
  // -------------------------------------------------------------------------

  describe('getDisplayName', () => {
    it('should strip sme-mart prefix', () => {
      expect(service.getDisplayName('sme-mart.eng.amber-circuit')).toBe('amber-circuit');
    });

    it('should strip old ENG- prefix', () => {
      expect(service.getDisplayName('ENG-amber-circuit')).toBe('amber-circuit');
    });
  });

  // -------------------------------------------------------------------------
  // Phase detection
  // -------------------------------------------------------------------------

  describe('isEngagementPhase', () => {
    it('should detect new convention', () => {
      expect(service.isEngagementPhase('sme-mart.eng.amber-circuit')).toBe(true);
    });

    it('should detect old convention', () => {
      expect(service.isEngagementPhase('ENG-amber-circuit')).toBe(true);
    });

    it('should return false for null/undefined', () => {
      expect(service.isEngagementPhase(null)).toBe(false);
      expect(service.isEngagementPhase(undefined)).toBe(false);
    });
  });

  describe('isRfpPhase', () => {
    it('should return true when no tag', () => {
      expect(service.isRfpPhase(null)).toBe(true);
      expect(service.isRfpPhase(undefined)).toBe(true);
    });

    it('should detect sme-mart.rfp prefix', () => {
      expect(service.isRfpPhase('sme-mart.rfp.coral-viper')).toBe(true);
    });

    it('should return false for engagement tags', () => {
      expect(service.isRfpPhase('sme-mart.eng.amber-circuit')).toBe(false);
    });
  });
});
