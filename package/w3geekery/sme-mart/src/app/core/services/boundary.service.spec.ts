import { TestBed } from '@angular/core/testing';
import { BoundaryService } from './boundary.service';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';

describe('BoundaryService', () => {
  let service: BoundaryService;
  let mockClientApi: any;
  let mockBoundaryApi: any;

  beforeEach(() => {
    mockBoundaryApi = {
      listBoundaryParties: async () => ({ results: [] }),
      listBoundaryPartyRoles: async () => ({ results: [] }),
      listBoundaryTeams: async () => ({ results: [] }),
      getBoundary: async () => ({ id: 'boundary-1', name: 'Test Boundary' }),
    };

    mockClientApi = {
      platformClient: {
        getBoundaryApi: () => mockBoundaryApi,
      },
    };

    TestBed.configureTestingModule({
      providers: [
        BoundaryService,
        { provide: ZerobiasClientApi, useValue: mockClientApi },
      ],
    });

    service = TestBed.inject(BoundaryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('listBoundaryParties', () => {
    it('should call getBoundaryApi().listBoundaryParties with correct parameters', async () => {
      const boundaryId = 'test-boundary-id';
      mockBoundaryApi.listBoundaryParties = async (id: string, page: number, size: number) => {
        expect(id).toBe(boundaryId);
        expect(page).toBe(1);
        expect(size).toBe(100);
        return { results: [{ id: 'party-1', name: 'Party One' }] };
      };

      const result = await service.listBoundaryParties(boundaryId);

      expect(result).toEqual([{ id: 'party-1', name: 'Party One' }]);
    });

    it('should return empty array on error', async () => {
      mockBoundaryApi.listBoundaryParties = async () => {
        throw new Error('API error');
      };

      const result = await service.listBoundaryParties('test-boundary-id');

      expect(result).toEqual([]);
    });
  });

  describe('listBoundaryPartyRoles', () => {
    it('should call getBoundaryApi().listBoundaryPartyRoles with correct parameters', async () => {
      const boundaryId = 'test-boundary-id';
      const partyId = 'test-party-id';
      mockBoundaryApi.listBoundaryPartyRoles = async (
        bId: string,
        pId: string,
        page: number,
        size: number
      ) => {
        expect(bId).toBe(boundaryId);
        expect(pId).toBe(partyId);
        expect(page).toBe(1);
        expect(size).toBe(100);
        return { results: [{ id: 'role-1', name: 'Admin' }] };
      };

      const result = await service.listBoundaryPartyRoles(boundaryId, partyId);

      expect(result).toEqual([{ id: 'role-1', name: 'Admin' }]);
    });

    it('should return empty array on error', async () => {
      mockBoundaryApi.listBoundaryPartyRoles = async () => {
        throw new Error('API error');
      };

      const result = await service.listBoundaryPartyRoles('boundary-id', 'party-id');

      expect(result).toEqual([]);
    });
  });

  describe('listBoundaryTeams', () => {
    it('should call getBoundaryApi().listBoundaryTeams with correct parameters', async () => {
      const boundaryId = 'test-boundary-id';
      mockBoundaryApi.listBoundaryTeams = async (id: string, page: number, size: number) => {
        expect(id).toBe(boundaryId);
        expect(page).toBe(1);
        expect(size).toBe(100);
        return { results: [{ id: 'team-1', name: 'Team One' }] };
      };

      const result = await service.listBoundaryTeams(boundaryId);

      expect(result).toEqual([{ id: 'team-1', name: 'Team One' }]);
    });

    it('should return empty array on error', async () => {
      mockBoundaryApi.listBoundaryTeams = async () => {
        throw new Error('API error');
      };

      const result = await service.listBoundaryTeams('test-boundary-id');

      expect(result).toEqual([]);
    });
  });

  describe('getBoundary', () => {
    it('should return boundary with id and name', async () => {
      mockBoundaryApi.getBoundary = async () => ({
        id: { toString: () => 'boundary-1' },
        name: 'Test Boundary',
      });

      const result = await service.getBoundary('boundary-1');

      expect(result).toEqual({ id: 'boundary-1', name: 'Test Boundary' });
    });

    it('should return null on error', async () => {
      mockBoundaryApi.getBoundary = async () => {
        throw new Error('API error');
      };

      const result = await service.getBoundary('boundary-1');

      expect(result).toBeNull();
    });
  });
});
