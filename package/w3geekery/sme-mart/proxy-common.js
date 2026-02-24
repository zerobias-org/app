// Shared proxy configuration factory
// Adapted from ~/zb-repos/ui/proxy-dev.conf.js pattern

// Prevent dev server crashes on connection issues
process.on('uncaughtException', (err) => {
  if (err.code === 'ECONNRESET' || err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
    console.warn(`[Uncaught Proxy Error] ${err.code} - connection issue, continuing...`);
  } else {
    throw err;
  }
});

const onProxyError = (err, req, res) => {
  console.warn(`[Proxy Error] ${err.code || err.message} for ${req.url}`);
  if (res && res.writeHead && !res.headersSent) {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Proxy error', code: err.code }));
  }
};

function createOnProxyReq(orgIdEnvVar) {
  return (proxyReq, req, res) => {
    // Inject dana-org-id cookie if org ID is set
    const orgId = process.env[orgIdEnvVar];
    if (orgId) {
      const existingCookie = proxyReq.getHeader('cookie') || '';
      if (!existingCookie.includes('dana-org-id')) {
        const updatedCookie = existingCookie
          ? `${existingCookie}; dana-org-id=${orgId}`
          : `dana-org-id=${orgId}`;
        proxyReq.setHeader('cookie', updatedCookie);
      }
    }

    proxyReq.on('error', (err) => {
      console.warn(`[Proxy Request Error] ${err.code || err.message} for ${req.url}`);
    });
    if (proxyReq.socket) {
      proxyReq.socket.on('error', (err) => {
        console.warn(`[Proxy Socket Error] ${err.code || err.message}`);
      });
    }
  };
}

const onProxyRes = (proxyRes, req, res) => {
  proxyRes.on('error', (err) => {
    console.warn(`[Proxy Response Error] ${err.code || err.message} for ${req.url}`);
  });
};


/**
 * Create proxy config for a ZeroBias environment.
 *
 * @param {Object} options
 * @param {string} options.target - ZeroBias host (e.g., 'https://ci.zerobias.com')
 * @param {string} options.apiKeyEnvVar - Env var name for API key
 * @param {string} options.orgIdEnvVar - Env var name for org ID
 */
function createProxyConfig({ target, apiKeyEnvVar, orgIdEnvVar }) {
  const apiKey = process.env[apiKeyEnvVar];
  if (!apiKey) {
    console.warn(`\n⚠️  ${apiKeyEnvVar} not set. API calls will not be authenticated.`);
    console.warn(`   Set it in .env.local or export it before running.\n`);
  }

  const onProxyReq = createOnProxyReq(orgIdEnvVar);

  return {
    '/api': {
      target: `${target}/api`,
      secure: false,
      changeOrigin: true,
      pathRewrite: { '^/api': '' },
      logLevel: 'debug',
      headers: {
        ...(apiKey ? { 'Authorization': `APIKey ${apiKey}` } : {}),
      },
      onError: onProxyError,
      onProxyReq: onProxyReq,
      onProxyRes: onProxyRes,
    },
    // WebSocket proxy removed — SME Mart doesn't use portal session WebSocket.
    // Set socketUrlPath: '' in environment files to disable SDK WebSocket connection.
  };
}

module.exports = { createProxyConfig };
