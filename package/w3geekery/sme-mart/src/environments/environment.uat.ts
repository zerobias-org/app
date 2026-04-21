// UAT deployment environment (S3/CloudFront — uat.zerobias.com)
// Used by `ng build --configuration uat`
export const environment = {
  production: true,
  isLocalDev: false, // Session-based auth in platform iframe, no API key
  socketUrlPath: '', // Empty = no WebSocket connection (portal-only feature)
  localPortalOrigin: '',
  cdnUrl: 'https://cdn.zerobias.com',
  smeMartConnectionId: '', // Hub Module not active yet — set when Phase 3 completes
  dbMode: 'neon' as 'hub' | 'neon', // Switch to 'hub' when Hub Module connection is ready
  neonConnectionString: '', // NEVER embed credentials in deployed builds
  // AuditgraphDB Pipeline + Boundary (UAT — SME Marketplace DEV boundary, W3Geekery org)
  pipelineId: 'f6d1f579-fe02-4158-b99e-a55113fd70cb',
  boundaryId: 'c15fb2dc-4f8c-48b5-b27a-707bd516b005',
  featureFlags: {
    prefsBackend: 'localStorage' as 'localStorage' | 'pkv',
  },
};
