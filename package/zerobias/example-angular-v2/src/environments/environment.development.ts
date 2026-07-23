/**
 * Local-dev environment (`ng serve`). Auth is handled by `proxy.conf.js`, which forwards `/api`
 * to the backend and injects the `APIKey` header from `process.env.API_KEY` — so no key is ever
 * baked into a bundle. `isLocalDev` tells the client to use the proxied `/api` instead of the
 * cookie/SSO flow.
 */
// Inlined from package.json at build (mirrors the production environment file).
import { version } from '../../package.json';

export const environment = {
  production: false,
  isLocalDev: true,
  localPortalOrigin: 'http://localhost:4200',
  /** Shown in the user menu; the source of truth is package.json. */
  version,
};
