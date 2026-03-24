// Proxy config for DEV (CI) environment: ci.zerobias.com
// Usage: npm start (default) or npm run start:dev
// Requires: API_KEY env var (CI API key)

const { createProxyConfig } = require('./proxy-common');

module.exports = createProxyConfig({
  target: 'https://ci.zerobias.com',
  apiKeyEnvVar: 'API_KEY',
  orgIdEnvVar: 'ZB_ORG_ID',
});
