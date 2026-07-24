/**
 * Local-dev proxy for `ng serve` (development only; never part of a deployed build).
 *
 * A `localhost` browser can't share the platform's session cookie, so local dev authenticates with
 * an API key. This proxy forwards every `/api/*` request to UAT — where the HL7 receiver connection
 * lives — and injects `Authorization: APIKey <key>`, reading the key from `process.env.ZB_TOKEN_UAT`
 * at serve time, so the key is never committed or bundled.
 *
 *   export ZB_TOKEN_UAT='<your UAT ZeroBias API key>'   # then: npm start
 *
 * The scheme matters: this backend accepts `APIKey <token>` (and `ApiKey`), NOT `Bearer` — a Bearer
 * header comes back 401. `session <id>` is the deployed browser flow and can't be used with a key.
 *
 * `ng serve` binds 0.0.0.0 (see angular.json) so the dev server is reachable over SSH from another
 * machine; that doesn't affect where this proxy forwards to.
 */
module.exports = {
  '/api': {
    target: 'https://uat.zerobias.com',
    changeOrigin: true,
    secure: true,
    headers: {
      Authorization: `APIKey ${process.env.ZB_TOKEN_UAT ?? ''}`,
    },
  },
};
