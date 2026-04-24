export const environment = {
  production: true,
  isLocalDev: false,
  socketUrlPath: '', // Empty = no WebSocket connection (portal-only feature)
  localPortalOrigin: '',
  apiHostname: '',
  cdnUrl: 'https://cdn.zerobias.com',
  // TODO(prod-hub): Kevin to provision prod generic-sql deployment + connection against prod Neon; set UUID when ready. Blocks first prod release.
  smeMartConnectionId: '',
  dbMode: 'hub' as 'hub' | 'neon',
  neonConnectionString: '', // Never used in prod — Hub Module handles credentials
  // AuditgraphDB Pipeline + Boundary (prod — Zerobias org)
  pipelineId: '091d5068-0527-4f45-9839-37f6d5c1669e',
  boundaryId: '2842fab1-ceff-4ec4-bf09-ce5e7c33c3e2',
  featureFlags: {
    prefsBackend: 'pkv' as 'localStorage' | 'pkv',
  },
};
