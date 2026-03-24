export const environment = {
  production: true,
  isLocalDev: false,
  socketUrlPath: '', // Empty = no WebSocket connection (portal-only feature)
  localPortalOrigin: '',
  cdnUrl: 'https://cdn.zerobias.com',
  smeMartConnectionId: '', // Set per deployment
  dbMode: 'hub' as 'hub' | 'neon',
  neonConnectionString: '', // Never used in prod — Hub Module handles credentials
  // AuditgraphDB Pipeline + Boundary (prod — Zerobias org)
  pipelineId: '091d5068-0527-4f45-9839-37f6d5c1669e',
  boundaryId: '2842fab1-ceff-4ec4-bf09-ce5e7c33c3e2',
};
