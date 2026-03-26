/**
 * Shared mock factories for Angular services used across SME Mart tests.
 * Pattern mirrors ~/Projects/zb/ui/projects/zb-ui-lib/src/test-helpers/angular.ts
 */

import { vi } from 'vitest';

// ---------------------------------------------------------------------------
// Angular Material mocks
// ---------------------------------------------------------------------------

/** Mock MatSnackBar */
export function fakeSnackBar() {
  return {
    open: vi.fn(),
    openFromComponent: vi.fn(),
  };
}

/** Mock MatDialog */
export function fakeMatDialog() {
  return {
    open: vi.fn(() => ({
      afterClosed: () => ({ subscribe: vi.fn() }),
    })),
  };
}

// ---------------------------------------------------------------------------
// SME Mart service mocks
// ---------------------------------------------------------------------------

/**
 * Mock SmeMartDbService with standard CRUD methods.
 *
 * Usage:
 *   const mockDb = fakeSmeMartDb();
 *   mockDb.searchRows.mockResolvedValue({ items: [...], totalCount: 1 });
 */
export function fakeSmeMartDb() {
  return {
    listRows: vi.fn().mockResolvedValue({ items: [], totalCount: 0 }),
    searchRows: vi.fn().mockResolvedValue({ items: [], totalCount: 0 }),
    getRow: vi.fn().mockResolvedValue(null),
    createRow: vi.fn().mockResolvedValue({}),
    updateRow: vi.fn().mockResolvedValue({}),
    deleteRow: vi.fn().mockResolvedValue(undefined),
    neonQueryPublic: vi.fn().mockResolvedValue({ rows: [] }),
  };
}

/** Mock ImpersonationService */
export function fakeImpersonation(userId = 'u-100') {
  return {
    effectiveUserId: vi.fn().mockReturnValue(userId),
  };
}

/** Mock SmeMartTagService */
export function fakeSmeMartTagService() {
  return {
    generateEngagementTag: vi.fn().mockReturnValue('sme-mart.eng.amber-circuit'),
    generateUniqueTag: vi.fn().mockReturnValue('sme-mart.eng.blue-wave'),
    isRfpPhase: vi.fn().mockReturnValue(true),
    isEngagementPhase: vi.fn().mockReturnValue(false),
    createTag: vi.fn().mockResolvedValue({ id: 'tag-uuid', name: 'sme-mart.eng.amber-circuit' }),
    searchTags: vi.fn().mockResolvedValue({ items: [] }),
    tagResource: vi.fn().mockResolvedValue(undefined),
    untagResource: vi.fn().mockResolvedValue(undefined),
    getTagsForResource: vi.fn().mockResolvedValue([]),
  };
}

/** Mock EngagementContextService */
export function fakeEngagementContext() {
  return {
    setEngagement: vi.fn(),
    setCurrentUserId: vi.fn(),
    setCurrentProviderId: vi.fn(),
    clear: vi.fn(),
    refresh$: { subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }) },
  };
}

/** Mock EngagementHierarchyService */
export function fakeEngagementHierarchy() {
  return {
    buildBreadcrumbs: vi.fn().mockResolvedValue([
      { level: 'engagement', label: 'Test Engagement', active: true },
    ]),
  };
}

/** Mock NotificationService */
export function fakeNotificationService() {
  return {
    notifications: vi.fn().mockReturnValue([]),
    loading: vi.fn().mockReturnValue(false),
    unreadCount: vi.fn().mockReturnValue(0),
    events: { next: vi.fn(), subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }) },
    startPolling: vi.fn(),
    stopPolling: vi.fn(),
    loadNotifications: vi.fn().mockResolvedValue(undefined),
    loadByType: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue({}),
    markAsRead: vi.fn().mockResolvedValue(undefined),
    markAllAsRead: vi.fn().mockResolvedValue(undefined),
    dismiss: vi.fn().mockResolvedValue(undefined),
    dismissAll: vi.fn().mockResolvedValue(undefined),
  };
}

/** Mock DocumentService */
export function fakeDocumentService() {
  return {
    uploadProgress$: { subscribe: vi.fn() },
    uploadDocument: vi.fn().mockResolvedValue({ id: 'doc-001' }),
    uploadBinary: vi.fn().mockResolvedValue({ id: 'doc-001' }),
    getPreviewUrl: vi.fn().mockReturnValue('https://preview.example.com'),
    getDownloadUrl: vi.fn().mockReturnValue('https://download.example.com'),
    isPreviewable: vi.fn().mockReturnValue(true),
    getFileIcon: vi.fn().mockReturnValue('description'),
    formatFileSize: vi.fn().mockReturnValue('1.2 MB'),
  };
}

/**
 * Mock ZerobiasClientApi with nested Proxy-based client chains.
 * Pattern from zb/ui: auto-generates mocked methods on access.
 *
 * Usage:
 *   const clientApi = fakeClientApi();
 *   clientApi.hydraClient.getTagApi().createTag.mockResolvedValue({...});
 *
 * Access the underlying API mock directly:
 *   clientApi.hydraClient.getTagApi._api.createTag.mockResolvedValue({...});
 */
export function fakeClientApi() {
  const makeApi = () => new Proxy({} as Record<string | symbol, any>, {
    get(target, prop) {
      if (!(prop in target)) {
        (target as any)[prop] = vi.fn();
      }
      return (target as any)[prop];
    },
  });

  const makeClient = () => new Proxy({} as Record<string | symbol, any>, {
    get(target, prop) {
      if (!(prop in target)) {
        const api = makeApi();
        (target as any)[prop] = vi.fn(() => api);
        (target as any)[prop]._api = api;
      }
      return (target as any)[prop];
    },
  });

  return {
    platformClient: makeClient(),
    portalClient: makeClient(),
    hydraClient: makeClient(),
    filesClient: makeClient(),
    hubClient: makeClient(),
    storeClient: makeClient(),
    danaClient: makeClient(),
    toUUID: vi.fn((id: any) => id),
    UUIDtoString: vi.fn((id: any) => id?.toString?.() ?? id),
  };
}

// ---------------------------------------------------------------------------
// AuditgraphDB Migration mocks (Pipeline + GraphQL services)
// ---------------------------------------------------------------------------

/**
 * Mock PipelineWriteService for testing entity pushes to AuditgraphDB.
 *
 * All methods return Promises that resolve successfully by default.
 * Override specific methods in tests to simulate failures or verify calls.
 *
 * Usage:
 *   const mockPipeline = fakePipelineWriteService();
 *   mockPipeline.pushEntity.mockResolvedValue(undefined);
 *   mockPipeline.pushEntities.mockResolvedValue(undefined);
 */
export function fakePipelineWriteService() {
  return {
    pushEntity: vi.fn().mockResolvedValue(undefined),
    pushEntities: vi.fn().mockResolvedValue(undefined),
    deleteEntity: vi.fn().mockResolvedValue(undefined),
    deleteEntities: vi.fn().mockResolvedValue(undefined),
    getCached: vi.fn().mockReturnValue(null),
  };
}

/**
 * Mock GraphqlReadService for testing GQL queries against AuditgraphDB.
 *
 * Provides default empty results. Override in tests to return realistic fixtures.
 *
 * Usage:
 *   const mockGql = fakeGraphqlReadService();
 *   mockGql.query.mockResolvedValue({
 *     items: [ENGAGEMENT_GQL_FIXTURE],
 *     page: { pageNumber: 1, pageSize: 50, totalCount: 1 }
 *   });
 */
export function fakeGraphqlReadService() {
  return {
    query: vi.fn().mockResolvedValue({
      items: [],
      page: { pageNumber: 1, pageSize: 50, totalCount: 0 },
    }),
    getById: vi.fn().mockResolvedValue(null),
    rawQuery: vi.fn().mockResolvedValue({}),
  };
}
