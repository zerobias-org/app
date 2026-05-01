// UAT deployment environment (S3/CloudFront — uat.zerobias.com)
// Used by `ng build --configuration uat`
export const environment = {
  production: true,
  isLocalDev: false, // Session-based auth in platform iframe, no API key
  socketUrlPath: '', // Empty = no WebSocket connection (portal-only feature)
  localPortalOrigin: '',
  apiHostname: '',
  cdnUrl: 'https://cdn.zerobias.com',
  // Generic SQL Hub connection — UAT SME Marketplace DEV boundary, @auditlogic/module-auditmation-generic-sql@0.5.0 (readwrite Neon role).
  smeMartConnectionId: 'a7b22df3-dee5-443a-b562-0256d86e46ec',
  dbMode: 'hub' as 'hub' | 'neon',
  neonConnectionString: '', // NEVER embed credentials in deployed builds
  // AuditgraphDB Pipeline + Boundary (UAT — SME Marketplace DEV boundary, W3Geekery org)
  pipelineId: '43f08afd-7ab9-4e99-a93c-619c46adaabe',
  boundaryId: 'c15fb2dc-4f8c-48b5-b27a-707bd516b005',
  featureFlags: {
    prefsBackend: 'localStorage' as 'localStorage' | 'pkv',
  },
};
