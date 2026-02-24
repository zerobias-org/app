// Proxy config for Production environment: app.zerobias.com
// Usage: npm run start:prod
// Requires: ZEROBIAS_PROD_API_KEY env var

const { createProxyConfig } = require('./proxy-common');

module.exports = createProxyConfig({
  target: 'https://app.zerobias.com',
  apiKeyEnvVar: 'ZEROBIAS_PROD_API_KEY',
  orgIdEnvVar: 'ZEROBIAS_PROD_ORG_ID',
});
