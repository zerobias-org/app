// Proxy config for QA environment: qa.zerobias.com
// Usage: npm run start:qa
// Requires: ZEROBIAS_QA_API_KEY env var

const { createProxyConfig } = require('./proxy-common');

module.exports = createProxyConfig({
  target: 'https://qa.zerobias.com',
  apiKeyEnvVar: 'ZEROBIAS_QA_API_KEY',
  orgIdEnvVar: 'ZEROBIAS_QA_ORG_ID',
});
