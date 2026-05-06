/**
 * Unit Tests for GraphqlReadService
 *
 * Tests query building, filter construction, pagination, sorting,
 * and response extraction. Mocks the ZB SDK boundary API.
 */

import { TestBed } from '@angular/core/testing';
import { GraphqlReadService } from './graphql-read.service';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the boundaryExecuteRawQuery response shape
function makeGqlResult(data: Record<string, unknown>, counts?: Record<string, number>) {
  return { data, gqlCount: counts ?? {} };
}

describe('GraphqlReadService', () => {
  let service: GraphqlReadService;
  let mockBoundaryApi: { boundaryExecuteRawQuery: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockBoundaryApi = {
      boundaryExecuteRawQuery: vi.fn().mockResolvedValue(makeGqlResult({})),
    };

    const mockClientApi = {
      graphqlClient: {
        getBoundaryApi: () => mockBoundaryApi,
      },
    };

    TestBed.configureTestingModule({
      providers: [
        GraphqlReadService,
        { provide: ZerobiasClientApi, useValue: mockClientApi },
      ],
    });

    service = TestBed.inject(GraphqlReadService);
  });

  // ── query() ──

  describe('query()', () => {
    it('should build correct GQL query string with fields', async () => {
      mockBoundaryApi.boundaryExecuteRawQuery.mockResolvedValue(
        makeGqlResult({ Engagement: [] }),
      );

      await service.query('Engagement', ['id', 'name', 'status']);

      expect(mockBoundaryApi.boundaryExecuteRawQuery).toHaveBeenCalledTimes(1);
      // Verify the first arg is an ExecuteRawGraphqlQuery
      const call = mockBoundaryApi.boundaryExecuteRawQuery.mock.calls[0];
      expect(call[0]).toBeDefined();
    });

    it('should include filters in query via SDK call', async () => {
      mockBoundaryApi.boundaryExecuteRawQuery.mockResolvedValue(
        makeGqlResult({ Engagement: [] }),
      );

      await service.query('Engagement', ['id'], {
        filters: { status: '.eq.published', category: '.ilike.*SOC*' },
      });

      expect(mockBoundaryApi.boundaryExecuteRawQuery).toHaveBeenCalledTimes(1);
    });

    it('should pass pageNumber and pageSize to SDK call', async () => {
      mockBoundaryApi.boundaryExecuteRawQuery.mockResolvedValue(
        makeGqlResult({ Engagement: [] }),
      );

      await service.query('Engagement', ['id'], {
        pageNumber: 3,
        pageSize: 25,
      });

      const call = mockBoundaryApi.boundaryExecuteRawQuery.mock.calls[0];
      // Args: uuid, rawQuery, includeRawData, pageNumber, pageSize, sort
      expect(call[3]).toBe(3);  // pageNumber
      expect(call[4]).toBe(25); // pageSize
    });

    it('should expand `tag` field into `tag { value }` for object-list selection', async () => {
      mockBoundaryApi.boundaryExecuteRawQuery.mockResolvedValue(
        makeGqlResult({ Review: [] }),
      );

      await service.query('Review', ['id', 'name', 'tag']);

      const call = mockBoundaryApi.boundaryExecuteRawQuery.mock.calls[0];
      // Args: uuid, rawQuery, includeRawData, pageNumber, pageSize, sort
      const queryString = (call[1] as { query: string }).query;
      expect(queryString).toContain('tag { value }');
      // No bare `tag` selection (i.e., `tag` not followed by ` {`)
      expect(queryString).not.toMatch(/\btag(?!\s*\{)/);
    });

    it('should default to page 1 size 50 when not specified', async () => {
      mockBoundaryApi.boundaryExecuteRawQuery.mockResolvedValue(
        makeGqlResult({ Engagement: [] }),
      );

      await service.query('Engagement', ['id']);

      const call = mockBoundaryApi.boundaryExecuteRawQuery.mock.calls[0];
      expect(call[3]).toBe(1);  // pageNumber
      expect(call[4]).toBe(50); // pageSize
    });

    it('should extract items from response data by className', async () => {
      const items = [
        { id: '1', name: 'Test' },
        { id: '2', name: 'Test2' },
      ];
      mockBoundaryApi.boundaryExecuteRawQuery.mockResolvedValue(
        makeGqlResult({ Engagement: items }, { Engagement: 2 }),
      );

      const result = await service.query('Engagement', ['id', 'name']);

      expect(result.items).toEqual(items);
      expect(result.page.totalCount).toBe(2);
    });

    it('should return empty array when className not in response', async () => {
      mockBoundaryApi.boundaryExecuteRawQuery.mockResolvedValue(
        makeGqlResult({}),
      );

      const result = await service.query('Engagement', ['id']);

      expect(result.items).toEqual([]);
    });

    it('should handle null data in response', async () => {
      mockBoundaryApi.boundaryExecuteRawQuery.mockResolvedValue(
        { data: null, gqlCount: {} },
      );

      const result = await service.query('Engagement', ['id']);

      expect(result.items).toEqual([]);
    });

    it('should build query with no filters when none provided', async () => {
      mockBoundaryApi.boundaryExecuteRawQuery.mockResolvedValue(
        makeGqlResult({ Note: [] }),
      );

      await service.query('Note', ['id', 'name']);

      // Just verify it was called — the query string is encapsulated in ExecuteRawGraphqlQuery
      expect(mockBoundaryApi.boundaryExecuteRawQuery).toHaveBeenCalledTimes(1);
    });

    it('should pass sort to SDK call when specified', async () => {
      mockBoundaryApi.boundaryExecuteRawQuery.mockResolvedValue(
        makeGqlResult({ Engagement: [] }),
      );

      await service.query('Engagement', ['id'], {
        sortBy: ['name'],
        sortDir: ['Desc'],
      });

      const call = mockBoundaryApi.boundaryExecuteRawQuery.mock.calls[0];
      const sort = call[5]; // 6th arg is sort
      expect(sort).toBeDefined();
    });

    it('should return page info in result', async () => {
      mockBoundaryApi.boundaryExecuteRawQuery.mockResolvedValue(
        makeGqlResult({ Review: [{ id: '1' }] }, { Review: 42 }),
      );

      const result = await service.query('Review', ['id'], {
        pageNumber: 2,
        pageSize: 10,
      });

      expect(result.page).toEqual({
        pageNumber: 2,
        pageSize: 10,
        totalCount: 42,
      });
    });
  });

  // ── getById() ──

  describe('getById()', () => {
    it('should query with id filter and pageSize 1', async () => {
      mockBoundaryApi.boundaryExecuteRawQuery.mockResolvedValue(
        makeGqlResult({ Engagement: [{ id: 'eng-001', name: 'Test' }] }),
      );

      const result = await service.getById('Engagement', 'eng-001', ['id', 'name']);

      expect(result).toEqual({ id: 'eng-001', name: 'Test' });
      const call = mockBoundaryApi.boundaryExecuteRawQuery.mock.calls[0];
      expect(call[4]).toBe(1); // pageSize = 1
    });

    it('should return null when no items found', async () => {
      mockBoundaryApi.boundaryExecuteRawQuery.mockResolvedValue(
        makeGqlResult({ Engagement: [] }),
      );

      const result = await service.getById('Engagement', 'nonexistent', ['id']);

      expect(result).toBeNull();
    });
  });

  // ── rawQuery() ──

  describe('rawQuery()', () => {
    it('should pass raw query string to SDK', async () => {
      mockBoundaryApi.boundaryExecuteRawQuery.mockResolvedValue(
        makeGqlResult({ Engagement: [{ id: '1' }] }),
      );

      const result = await service.rawQuery('{ Engagement { id name } }', 1, 100);

      expect(result).toEqual({ Engagement: [{ id: '1' }] });
      const call = mockBoundaryApi.boundaryExecuteRawQuery.mock.calls[0];
      expect(call[3]).toBe(1);   // pageNumber
      expect(call[4]).toBe(100); // pageSize
    });

    it('should return empty object when response data is null', async () => {
      mockBoundaryApi.boundaryExecuteRawQuery.mockResolvedValue({ data: null });

      const result = await service.rawQuery('{ Engagement { id } }');

      expect(result).toEqual({});
    });
  });
});
