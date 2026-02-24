// Vercel deployment environment (QA backend)
// Used by `ng build --configuration vercel`
export const environment = {
  production: true,
  isLocalDev: true, // API key auth via Edge Middleware (same as local proxy)
  socketUrlPath: '', // Empty = no WebSocket connection (portal-only feature)
  localPortalOrigin: '',
  cdnUrl: '', // Assets served from Vercel, not ZeroBias CDN
  smeMartConnectionId: 'e3c874f5-5fd8-4fbc-8120-19861e28b19e', // Unused in neon mode
  dbMode: 'neon' as 'hub' | 'neon', // Direct Neon HTTP (Hub connector not active in QA)
  // TODO: Move to server-side proxy when Hub connection is working
  neonConnectionString:
    'postgresql://neondb_owner:npg_NjsYRTy2U6re@ep-aged-fog-af9wu771.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require'
};
