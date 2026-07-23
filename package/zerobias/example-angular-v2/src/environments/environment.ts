/**
 * Default (production) environment. This is the ONE build promoted across uat / qa / prod —
 * the ZeroBias client resolves its API host from `location.host` at runtime (origin-relative
 * `/api`), so no per-env values are baked in. `ng serve` swaps this for
 * `environment.development.ts` via the `fileReplacements` in angular.json.
 */
// The app version, inlined from package.json at build (the Angular counterpart of the React app's
// next.config `NEXT_PUBLIC_APP_VERSION`). Named import so the bundler keeps only the string.
import { version } from '../../package.json';

export const environment = {
  production: true,
  /** Deployed: platform session cookie + SSO redirect. Never local-dev in a production build. */
  isLocalDev: false,
  /** Only used by the client for local-dev iframe/postMessage targeting. */
  localPortalOrigin: '',
  /** Shown in the user menu; the source of truth is package.json. */
  version,
};
