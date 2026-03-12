import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { CatalogService } from './catalog.service';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import { makeListResult } from '../../test-helpers/factories';

describe('CatalogService', () => {
  let service: CatalogService;
  let mockListRoles: ReturnType<typeof vi.fn>;
  let mockListRoleCategories: ReturnType<typeof vi.fn>;
  let mockListQualifications: ReturnType<typeof vi.fn>;
  let mockSearchFrameworks: ReturnType<typeof vi.fn>;
  let mockListSegments: ReturnType<typeof vi.fn>;
  let mockListTags: ReturnType<typeof vi.fn>;
  let mockSearchProducts: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockListRoles = vi.fn().mockResolvedValue(makeListResult([
      { id: 'r1', name: 'Auditor', code: 'AUD', roleCategory: { id: 'cat1', name: 'GRC', externalCode: 'grc' } },
    ]));
    mockListRoleCategories = vi.fn().mockResolvedValue(makeListResult([
      { id: 'cat1', name: 'GRC', externalCode: 'grc' },
    ]));
    mockListQualifications = vi.fn().mockResolvedValue(makeListResult([
      { id: 's1', name: 's0011', description: 'Skill in Risk Management' },
    ]));
    mockSearchFrameworks = vi.fn().mockResolvedValue(makeListResult([
      { id: 'f1', name: 'NIST CSF', description: 'Cybersecurity framework' },
    ]));
    mockListSegments = vi.fn().mockResolvedValue(makeListResult([
      { id: 'seg1', name: 'Healthcare', code: 'HC' },
    ]));
    mockListTags = vi.fn().mockResolvedValue(makeListResult([
      { id: 'ss1', name: 'Incident Response', description: 'IR services' },
    ]));
    mockSearchProducts = vi.fn().mockResolvedValue(makeListResult([
      { id: 'p1', name: 'GitHub', vendorName: 'GitHub Inc' },
    ]));

    const mockClientApi = {
      platformClient: {
        getCatalogRoleApi: () => ({
          list: mockListRoles,
          listRoleCategories: mockListRoleCategories,
          listRoleQualifications: mockListQualifications,
        }),
        getSegmentApi: () => ({
          list: mockListSegments,
        }),
      },
      portalClient: {
        getFrameworkApi: () => ({
          search: mockSearchFrameworks,
        }),
        getProductApi: () => ({
          search: mockSearchProducts,
        }),
      },
      hydraClient: {
        getTagApi: () => ({
          listTags: mockListTags,
        }),
      },
    };

    TestBed.configureTestingModule({
      providers: [
        CatalogService,
        { provide: ZerobiasClientApi, useValue: mockClientApi },
      ],
    });

    service = TestBed.inject(CatalogService);
  });

  // ---------------------------------------------------------------------------
  // loadAll
  // ---------------------------------------------------------------------------

  describe('loadAll', () => {
    it('should load all catalog types in parallel', async () => {
      await service.loadAll();
      expect(mockListRoles).toHaveBeenCalled();
      expect(mockListQualifications).toHaveBeenCalled();
      expect(mockSearchFrameworks).toHaveBeenCalled();
      expect(mockListSegments).toHaveBeenCalled();
      expect(mockListTags).toHaveBeenCalled();
      expect(mockSearchProducts).toHaveBeenCalled();
    });

    it('should set loading flag', async () => {
      const promise = service.loadAll();
      expect(service.loading()).toBe(true);
      await promise;
      expect(service.loading()).toBe(false);
    });

    it('should populate signals', async () => {
      await service.loadAll();
      expect(service.roles().length).toBeGreaterThan(0);
      expect(service.skills().length).toBeGreaterThan(0);
      expect(service.frameworks().length).toBeGreaterThan(0);
      expect(service.segments().length).toBeGreaterThan(0);
      expect(service.serviceSegments().length).toBeGreaterThan(0);
      expect(service.products().length).toBeGreaterThan(0);
    });

    it('should compute totalLoaded', async () => {
      await service.loadAll();
      expect(service.totalLoaded()).toBe(6); // 1 of each type
    });

    it('should set error on failure', async () => {
      mockListRoles.mockRejectedValue(new Error('Network error'));
      await service.loadAll();
      expect(service.error()).toBe('Network error');
      expect(service.loading()).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Individual loaders
  // ---------------------------------------------------------------------------

  describe('loadRoles', () => {
    it('should map role fields and category name', async () => {
      const roles = await service.loadRoles();
      expect(roles[0].name).toBe('Auditor');
      expect(roles[0].categoryName).toBe('GRC (grc)');
    });

    it('should sort by category then name', async () => {
      mockListRoles.mockResolvedValue(makeListResult([
        { id: 'r1', name: 'Zebra', roleCategory: { name: 'A' } },
        { id: 'r2', name: 'Alpha', roleCategory: { name: 'A' } },
        { id: 'r3', name: 'Beta', roleCategory: { name: 'B' } },
      ]));
      const roles = await service.loadRoles();
      expect(roles.map(r => r.name)).toEqual(['Alpha', 'Zebra', 'Beta']);
    });
  });

  describe('loadRoleCategories', () => {
    it('should map category fields', async () => {
      const cats = await service.loadRoleCategories();
      expect(cats[0].name).toBe('GRC');
    });
  });

  describe('loadSkills', () => {
    it('should strip "Skill in " prefix and capitalize', async () => {
      const skills = await service.loadSkills();
      expect(skills[0].name).toBe('Risk Management');
      expect(skills[0].code).toBe('s0011');
    });
  });

  describe('loadFrameworks', () => {
    it('should map framework fields', async () => {
      const fw = await service.loadFrameworks();
      expect(fw[0].name).toBe('NIST CSF');
    });
  });

  describe('loadSegments', () => {
    it('should map segment fields', async () => {
      const segs = await service.loadSegments();
      expect(segs[0].name).toBe('Healthcare');
      expect(segs[0].code).toBe('HC');
    });
  });

  describe('loadServiceSegments', () => {
    it('should map service segment from hydra tags', async () => {
      const ss = await service.loadServiceSegments();
      expect(ss[0].name).toBe('Incident Response');
      expect(ss[0].type).toBe('service-segment');
    });
  });

  describe('loadProducts', () => {
    it('should sort by vendorName then name', async () => {
      mockSearchProducts.mockResolvedValue(makeListResult([
        { id: 'p1', name: 'Zebra', vendorName: 'A' },
        { id: 'p2', name: 'Alpha', vendorName: 'B' },
        { id: 'p3', name: 'Beta', vendorName: 'A' },
      ]));
      const products = await service.loadProducts();
      expect(products.map(p => p.name)).toEqual(['Beta', 'Zebra', 'Alpha']);
    });
  });

  // ---------------------------------------------------------------------------
  // Lookups
  // ---------------------------------------------------------------------------

  describe('findRole', () => {
    it('should find by id', async () => {
      await service.loadRoles();
      expect(service.findRole('r1')?.name).toBe('Auditor');
    });

    it('should find by code', async () => {
      await service.loadRoles();
      expect(service.findRole('AUD')?.name).toBe('Auditor');
    });

    it('should return undefined for missing', async () => {
      await service.loadRoles();
      expect(service.findRole('nonexistent')).toBeUndefined();
    });
  });

  describe('findSkill', () => {
    it('should find by code', async () => {
      await service.loadSkills();
      expect(service.findSkill('s0011')?.name).toBe('Risk Management');
    });
  });

  describe('findFramework', () => {
    it('should find by name', async () => {
      await service.loadFrameworks();
      expect(service.findFramework('NIST CSF')?.id).toBe('f1');
    });
  });

  describe('findSegment', () => {
    it('should find by code', async () => {
      await service.loadSegments();
      expect(service.findSegment('HC')?.name).toBe('Healthcare');
    });
  });

  describe('findServiceSegment', () => {
    it('should find by name', async () => {
      await service.loadServiceSegments();
      expect(service.findServiceSegment('Incident Response')?.id).toBe('ss1');
    });
  });

  describe('findProduct', () => {
    it('should find by name', async () => {
      await service.loadProducts();
      expect(service.findProduct('GitHub')?.vendorName).toBe('GitHub Inc');
    });
  });

  // ---------------------------------------------------------------------------
  // filterItems
  // ---------------------------------------------------------------------------

  describe('filterItems', () => {
    const items = [
      { name: 'Risk Management', code: 'RM', description: 'Managing risk' },
      { name: 'Security Audit', code: 'SA', description: 'Audit services' },
      { name: 'Compliance Review', code: 'CR', description: 'Regulatory review' },
    ];

    it('should return all items when search is empty', () => {
      expect(service.filterItems(items, '')).toHaveLength(3);
    });

    it('should match by name', () => {
      expect(service.filterItems(items, 'risk')).toHaveLength(1);
      expect(service.filterItems(items, 'risk')[0].name).toBe('Risk Management');
    });

    it('should match by code', () => {
      expect(service.filterItems(items, 'SA')).toHaveLength(1);
    });

    it('should match by description', () => {
      expect(service.filterItems(items, 'regulatory')).toHaveLength(1);
    });

    it('should be case insensitive', () => {
      expect(service.filterItems(items, 'AUDIT')).toHaveLength(1);
    });
  });
});
