#!/usr/bin/env node

/**
 * Standalone Development Server for Data Explorer
 *
 * This server:
 * - Serves static files from the dist/ directory
 * - Provides an API proxy to avoid CORS issues in local development
 * - Replaces the Next.js dev server for a simpler development workflow
 *
 * Usage:
 *   npm run dev    - Build and start dev server with hot rebuild
 *   npm start      - Start server with existing build
 */

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const fs = require('fs');

// Load environment variables in order of precedence
// .env.development.local takes precedence over .env.local
['.env.development.local', '.env.local'].forEach(file => {
  const envPath = path.join(__dirname, file);
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
    console.log(`Loaded: ${file}`);
  }
});

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_PATH = '/data-explorer';
// Use ZB_API_HOSTNAME for the actual API, not NEXT_PUBLIC_API_HOSTNAME
// (which is set to localhost for the client to use the proxy)
const API_HOSTNAME = process.env.ZB_API_HOSTNAME || 'https://ci.zerobias.com/api';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

// Log startup info
console.log('🚀 Data Explorer Development Server');
console.log('=====================================');
console.log(`Port:         ${PORT}`);
console.log(`Base Path:    ${BASE_PATH}`);
console.log(`API Proxy:    ${API_HOSTNAME}`);
console.log(`API Key:      ${API_KEY ? '✓ Configured' : '✗ Not configured'}`);
console.log('=====================================\n');

// Debug middleware - log ALL requests
app.use((req, res, next) => {
  console.log(`[Request] ${req.method} ${req.url}`);
  next();
});

// API Proxy - must come before static files to take precedence
// Client prefixes all API calls with /api, so we intercept /api and strip it before forwarding

// Manual proxy using http-proxy-middleware filter function and custom middleware
app.use('/api', (req, res, next) => {
  const targetUrl = `${API_HOSTNAME}${req.url}`;
  console.log(`\n[Proxy Request]`);
  console.log(`  From: ${req.method} /api${req.url}`);
  console.log(`  To:   ${targetUrl}`);
  console.log(`  Headers:`);

  // Add API key if configured
  if (API_KEY) {
    console.log(`    Authorization: APIKey ${API_KEY.substring(0, 8)}...`);
  } else {
    console.log('    ✗ WARNING: No API key configured!');
  }

  // Forward org ID header if present
  if (req.headers['dana-org-id']) {
    console.log(`    dana-org-id: ${req.headers['dana-org-id']}`);
  }

  next();
});

// Proxy all API calls - client prefixes with /api
console.log('Setting up proxy middleware for /api');
app.use('/api', createProxyMiddleware({
  target: API_HOSTNAME,
  changeOrigin: true,
  logLevel: 'debug',
  // Preserve cookies - rewrite domain to localhost
  cookieDomainRewrite: {
    '*': 'localhost'
  },
  cookiePathRewrite: {
    '*': '/'
  },
  // Preserve host header
  preserveHeaderKeyCase: true,
  on: {
    proxyReq: (proxyReq, req, res) => {
      // Log incoming cookies
      if (req.headers.cookie) {
        console.log(`[Proxy] Forwarding cookies: ${req.headers.cookie.substring(0, 100)}...`);
      }

      // Add API key if configured and not already present
      if (API_KEY && !req.headers['authorization']) {
        proxyReq.setHeader('Authorization', `APIKey ${API_KEY}`);
      }

      // Forward org ID header if present
      if (req.headers['dana-org-id']) {
        proxyReq.setHeader('dana-org-id', req.headers['dana-org-id']);
      }

      // Forward all cookies from client to API
      if (req.headers.cookie) {
        proxyReq.setHeader('Cookie', req.headers.cookie);
      }
    },
    proxyRes: (proxyRes, req, res) => {
      console.log(`[Proxy Response]`);
      console.log(`  Status: ${proxyRes.statusCode} ${proxyRes.statusMessage}`);

      // Log ALL response headers for session/login endpoints
      if (req.url.includes('/session') || req.url.includes('/login')) {
        console.log(`  Response Headers:`, JSON.stringify(proxyRes.headers, null, 2));
      }

      // Log cookies being set
      if (proxyRes.headers['set-cookie']) {
        console.log(`  Set-Cookie: ${proxyRes.headers['set-cookie'].join(', ')}`);
      }

      // Log dana-session-id header if present
      if (proxyRes.headers['dana-session-id']) {
        console.log(`  dana-session-id: ${proxyRes.headers['dana-session-id']}`);
      }

      // Log response body for /me endpoint to debug authentication
      if (req.url.includes('/me') || req.url.includes('/session')) {
        let body = '';
        proxyRes.on('data', (chunk) => {
          body += chunk;
        });
        proxyRes.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            console.log(`  Response body:`, JSON.stringify(parsed, null, 2));
          } catch (e) {
            console.log(`  Response body (raw):`, body.substring(0, 200));
          }
        });
      }

      console.log(`  For: ${req.method} /api${req.url}\n`);
    },
    error: (err, req, res) => {
      console.error(`\n[Proxy Error]`);
      console.error(`  Request: ${req.method} /api${req.url}`);
      console.error(`  Error: ${err.message}\n`);
      if (res.writeHead) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Proxy request failed', message: err.message }));
      }
    }
  }
}));

// Serve static files from dist/
const distPath = path.join(__dirname, 'dist');
app.use(BASE_PATH, express.static(distPath));

// Handle login/session expired redirects - send back to app
app.get('/login/session_expired.html', (req, res) => {
  console.log('[Redirect] Session expired, redirecting to app');
  res.redirect(BASE_PATH);
});

app.get('/login/', (req, res) => {
  console.log('[Redirect] Login page requested, redirecting to app');
  res.redirect(BASE_PATH);
});

// Fallback for client-side routing - serve index.html for all other routes
// Note: This must come after all other routes to act as a catch-all
app.use((req, res, next) => {
  if (req.path.startsWith(BASE_PATH)) {
    res.sendFile(path.join(distPath, 'index.html'));
  } else {
    next();
  }
});

// Root redirect
app.get('/', (req, res) => {
  res.redirect(BASE_PATH);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'data-explorer' });
});

// Start server
app.listen(PORT, () => {
  console.log(`✓ Server running at http://localhost:${PORT}`);
  console.log(`✓ Data Explorer available at http://localhost:${PORT}${BASE_PATH}\n`);
  console.log('Press Ctrl+C to stop\n');
});
