// Stack mode environment (unified-origin cloudfront-sim + real UAT login)
// Used by `npm run build:stack` — isLocalDev=false triggers real login flow
import { NEON_DATABASE_URL } from './environment.neon';

export const environment = {
  production: false,
  isLocalDev: false,                            // CRITICAL: false triggers real login flow (zerobias-client-app.ts line 348)
  apiHostname: 'http://localhost:15100',        // matches CLOUDFRONT_SIM_PORT (zbb-allocated; see STACKS.md port note)
  basePath: '/sme-mart',
  socketUrlPath: '',
  localPortalOrigin: '',
  cdnUrl: '',
  smeMartConnectionId: 'e3c874f5-5fd8-4fbc-8120-19861e28b19e',  // (same as dev environment.ts)
  dbMode: 'neon' as 'hub' | 'neon',
  pipelineId: '43f08afd-7ab9-4e99-a93c-619c46adaabe',           // (same as dev environment.ts)
  boundaryId: 'c15fb2dc-4f8c-48b5-b27a-707bd516b005',          // (same as dev environment.ts)
  neonConnectionString: NEON_DATABASE_URL,
  // Branded login configuration (stack mode uses local login)
  brandedLoginSubdomain: null,
  defaultLoginUrl: '/login/en_us/login.html',
  featureFlags: {
    prefsBackend: 'localStorage' as 'localStorage' | 'pkv',
  },
};
