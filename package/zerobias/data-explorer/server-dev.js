/**
 * Custom development server with comprehensive request/response logging
 * Run with: node server-dev.js
 */

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { createProxyMiddleware } = require('http-proxy-middleware');

const dev = true;
const hostname = 'localhost';
const port = 3000;

// Create Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const levelColors = {
    INFO: colors.blue,
    SUCCESS: colors.green,
    ERROR: colors.red,
    WARN: colors.yellow,
    REQUEST: colors.cyan,
    RESPONSE: colors.magenta,
  };

  const color = levelColors[level] || colors.white;
  console.log(`${color}[${timestamp}] [${level}]${colors.reset} ${message}`);

  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

// Create proxy middleware for API calls
const apiProxy = createProxyMiddleware({
  target: 'https://ci.zerobias.com',
  changeOrigin: true,
  secure: true,
  logLevel: 'debug',
  onProxyReq: (proxyReq, req, res) => {
    // Add origin header for CORS
    proxyReq.setHeader('Origin', 'http://localhost:3000');

    log('REQUEST', `Proxying ${req.method} ${req.url}`, {
      method: req.method,
      url: req.url,
      headers: {
        ...req.headers,
        // Mask sensitive headers
        authorization: req.headers.authorization ? '[REDACTED]' : undefined,
        cookie: req.headers.cookie ? '[REDACTED]' : undefined,
      },
    });
  },
  onProxyRes: (proxyRes, req, res) => {
    // Add CORS headers to response
    proxyRes.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000';
    proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Dana-Org-Id';

    const statusCode = proxyRes.statusCode;
    const level = statusCode >= 400 ? 'ERROR' : statusCode >= 300 ? 'WARN' : 'SUCCESS';

    log(level, `Proxy response ${req.method} ${req.url} - ${statusCode}`, {
      statusCode,
      statusMessage: proxyRes.statusMessage,
      headers: proxyRes.headers,
    });

    // Capture response body for failed requests
    if (statusCode >= 400) {
      let body = '';
      proxyRes.on('data', (chunk) => {
        body += chunk.toString('utf8');
      });
      proxyRes.on('end', () => {
        if (body) {
          try {
            const parsed = JSON.parse(body);
            log('ERROR', 'Failed request body:', parsed);
          } catch (e) {
            log('ERROR', 'Failed request body (non-JSON):', { body });
          }
        }
      });
    }
  },
  onError: (err, req, res) => {
    log('ERROR', `Proxy error for ${req.method} ${req.url}`, {
      message: err.message,
      stack: err.stack,
    });
    res.writeHead(500, {
      'Content-Type': 'application/json',
    });
    res.end(JSON.stringify({
      error: 'Proxy error',
      message: err.message,
    }));
  },
});

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      const { pathname } = parsedUrl;

      // Log all incoming requests
      if (!pathname.startsWith('/_next/') && !pathname.startsWith('/favicon')) {
        log('REQUEST', `Incoming ${req.method} ${pathname}`);
      }

      // Proxy API requests
      if (pathname.startsWith('/api/')) {
        return apiProxy(req, res);
      }

      // Handle all other requests with Next.js
      await handle(req, res, parsedUrl);
    } catch (err) {
      log('ERROR', 'Request handler error', {
        message: err.message,
        stack: err.stack,
      });
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  })
    .once('error', (err) => {
      log('ERROR', 'Server error', {
        message: err.message,
        stack: err.stack,
      });
      process.exit(1);
    })
    .listen(port, () => {
      log('INFO', `Development server ready on http://${hostname}:${port}`);
      log('INFO', `Proxying /api/* to https://ci.zerobias.com/api/*`);
      log('INFO', '');
      log('INFO', 'Logging configuration:');
      log('INFO', '  - All API requests and responses');
      log('INFO', '  - Request/response headers (sensitive data masked)');
      log('INFO', '  - Failed request bodies');
      log('INFO', '  - Proxy errors with stack traces');
      log('INFO', '');
    });
});
