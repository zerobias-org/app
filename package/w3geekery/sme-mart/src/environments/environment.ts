// Default development environment (CI)
// Used by `npm start` (ng serve with proxy-dev.conf.js)
import { NEON_DATABASE_URL } from './environment.neon';

export const environment = {
  production: false,
  isLocalDev: true,
  socketUrlPath: '', // Empty = no WebSocket connection (portal-only feature)
  localPortalOrigin: 'http://localhost:4200',
  cdnUrl: '',
  // Generic SQL Hub Module connection (QA)
  smeMartConnectionId: 'e3c874f5-5fd8-4fbc-8120-19861e28b19e',
  // DB access mode: 'hub' = DataProducer via Hub Module, 'neon' = direct Neon HTTP
  // Use 'neon' while Hub Module is unavailable, switch to 'hub' when ready
  dbMode: 'neon' as 'hub' | 'neon',
  // Neon connection string (only used when dbMode='neon')
  // Generated from NEON_DATABASE_URL in .env.local via scripts/gen-neon-env.mjs
  neonConnectionString: NEON_DATABASE_URL,
  // AuditgraphDB Pipeline + Boundary (UAT — SME Marketplace boundary, Zerobias org)
  pipelineId: 'f6d1f579-fe02-4158-b99e-a55113fd70cb',
  boundaryId: 'e3871f0b-56f0-4e5e-87c6-6ca196bf88c7',
};
