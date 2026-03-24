// Proxy config for UAT environment: uat.zerobias.com
// Usage: npm run dev (default) or npm run dev:uat
// Requires: ZEROBIAS_UAT_API_KEY env var

const { createProxyConfig } = require('./proxy-common');

module.exports = createProxyConfig({
  target: 'https://uat.zerobias.com',
  apiKeyEnvVar: 'ZEROBIAS_UAT_API_KEY',
  orgIdEnvVar: 'ZEROBIAS_UAT_ORG_ID',
});
