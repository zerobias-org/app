// Default development environment (CI)
// Used by `npm start` (ng serve with proxy-dev.conf.js)
import { NEON_DATABASE_URL } from './environment.neon';

export const environment = {
  production: false,
  isLocalDev: true,
  socketUrlPath: '', // Empty = no WebSocket connection (portal-only feature)
  localPortalOrigin: 'http://localhost:4200',
  apiHostname: '',
  cdnUrl: '',
  // Generic SQL Hub Module connection — UAT SME Marketplace DEV boundary, @auditlogic/module-auditmation-generic-sql@0.5.0
  smeMartConnectionId: 'a7b22df3-dee5-443a-b562-0256d86e46ec',
  // DB access mode: 'hub' = DataProducer via Hub Module, 'neon' = direct Neon HTTP
  // Dev defaults to 'neon' for fastest local iteration; flip to 'hub' locally to exercise the published-build path against UAT Hub.
  dbMode: 'neon' as 'hub' | 'neon',
  // Neon connection string (only used when dbMode='neon')
  // Generated from NEON_DATABASE_URL in .env.local via scripts/gen-neon-env.mjs
  neonConnectionString: NEON_DATABASE_URL,
  // AuditgraphDB Pipeline + Boundary (UAT — SME Marketplace DEV boundary, W3Geekery org)
  pipelineId: 'f6d1f579-fe02-4158-b99e-a55113fd70cb',
  boundaryId: 'c15fb2dc-4f8c-48b5-b27a-707bd516b005',
  // Branded login configuration
  brandedLoginSubdomain: null, // No subdomain in local dev
  defaultLoginUrl: '/login/en_us/login.html', // Local login fallback (matches app-init.service.ts line 36)
  // Feature flags
  featureFlags: {
    /** User prefs backend: 'localStorage' (fast, no network) or 'pkv' (cross-device sync via ZB API).
     *  Set to 'localStorage' while PKV returns 500 on UAT. Switch to 'pkv' when fixed. */
    prefsBackend: 'localStorage' as 'localStorage' | 'pkv',
  },
};
