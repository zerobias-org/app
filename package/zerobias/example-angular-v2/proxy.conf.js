/**
 * Local-dev proxy for `ng serve` (development only; never part of a deployed build).
 *
 * A `localhost` browser can't share the platform's session cookie, so local dev authenticates
 * with an API key. This proxy forwards every `/api/*` request to the UAT backend (matching
 * example-nextjs-v2, where the demo/AuditCrowd data is developed) and injects the
 * `Authorization: APIKey <key>` header, reading the key from `process.env.ZEROBIAS_UAT_API_KEY`
 * (the UAT key already exported in the dev shell) at serve time — so the key is never committed or
 * bundled. Same UAT platform example-nextjs-v2 targets.
 *
 *   export ZEROBIAS_UAT_API_KEY='<your UAT ZeroBias API key>'   # then: npm start
 */
module.exports = {
  '/api': {
    target: 'https://uat.zerobias.com',
    changeOrigin: true,
    secure: true,
    headers: {
      Authorization: `APIKey ${process.env.ZEROBIAS_UAT_API_KEY ?? ''}`,
    },
  },
};
