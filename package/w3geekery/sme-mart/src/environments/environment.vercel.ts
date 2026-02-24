// Vercel deployment environment (QA backend)
// Used by `ng build --configuration vercel`
export const environment = {
  production: true,
  isLocalDev: false,
  socketUrlPath: '', // Empty = no WebSocket connection (portal-only feature)
  localPortalOrigin: '',
  cdnUrl: '', // Assets served from Vercel, not ZeroBias CDN
  // Generic SQL Hub Module connection (QA)
  smeMartConnectionId: 'e3c874f5-5fd8-4fbc-8120-19861e28b19e',
  dbMode: 'hub' as 'hub' | 'neon',
  neonConnectionString: '', // Never used — Hub Module handles credentials
};
