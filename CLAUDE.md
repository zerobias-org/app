# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

The **ZeroBias Community App Repository** provides example custom applications that demonstrate how to build Single Page Applications (SPAs) that integrate with the ZeroBias platform. It includes starter templates for Angular and Next.js frameworks, showcasing authentication, API integration, and deployment patterns.

**Repository Role:** Example Applications - Templates for custom app development

This repository is **important** for understanding how to extend the ZeroBias platform with custom applications that run within the platform portal as embedded iframes or standalone applications.

## Architecture

### Repository Structure

```
app/
├── package/zerobias/
│   ├── example-angular/          # Angular example app
│   │   ├── src/
│   │   │   ├── app/             # App components
│   │   │   ├── assets/          # Static assets
│   │   │   ├── environments/    # Environment configs
│   │   │   ├── styles.scss      # Global styles
│   │   │   ├── main.ts          # App entry point
│   │   │   └── index.html       # HTML template
│   │   ├── package.json
│   │   └── README.md
│   └── example-nextjs/           # Next.js example app
│       ├── app/                 # Next.js App Router
│       ├── components/          # React components
│       ├── context/             # React contexts
│       ├── lib/                 # Utility libraries
│       ├── public/              # Static files
│       ├── styles/              # CSS/SCSS files
│       ├── next.config.*.ts     # Environment configs
│       ├── package.json
│       └── README.md
├── .github/                      # GitHub Actions workflows
└── README.md                     # Repository overview
```

## Example Applications

### Angular Example (`example-angular`)

**Purpose:** Demonstrates Angular integration with ZeroBias platform

**Framework:** Angular 17.x with Angular Material

**Key Features:**
- ZeroBias client library integration (`@auditmation/ngx-zb-client-lib`)
- Authentication via platform session
- API calls to platform services (Portal, Hub, Platform)
- Hub module client usage (GitHub example)
- Material Design components
- Responsive layout
- Iframe communication with parent portal

**Stack:**
- **Angular** 17.1.3 - Framework
- **Angular Material** 17.1.2 - UI components
- **@auditmation/ngx-zb-client-lib** - ZeroBias Angular client
- **@auditlogic/module-github-github-client-ts** - Example Hub module client
- **RxJS** 6.6.7 - Reactive programming
- **Nx** 20.6.1 - Build system

---

### Next.js Example (`example-nextjs`)

**Purpose:** Demonstrates Next.js/React integration with ZeroBias platform

**Framework:** Next.js 15.x with React 19

**Key Features:**
- ZeroBias vanilla TypeScript client (`@auditmation/zb-client-lib-js`)
- Server-side rendering (SSR) support
- API routes for backend logic
- Hub module client usage (GitHub example)
- Modern React patterns (hooks, context)
- Multiple environment configurations (dev, qa, prod)
- Tailwind CSS styling
- Iframe communication

**Stack:**
- **Next.js** 15.3.2 - React framework
- **React** 19.0.0 - UI library
- **@auditmation/zb-client-lib-js** - ZeroBias vanilla client
- **@auditlogic/module-github-github-client-ts** - Example Hub module client
- **TypeScript** 5.x - Type safety
- **Sass** - CSS preprocessing

---

## Custom App Patterns

### Authentication Integration

Both examples demonstrate platform authentication patterns:

**1. Session Inheritance (Iframe Mode):**
```typescript
// App runs in iframe, inherits session from parent portal
const app = new ZerobiasClientApp(api, orgIdService, environment);
await app.init(); // No custom auth needed

// Session managed by parent portal
const whoAmI = await app.whoAmI();
```

**2. Direct Authentication (Standalone Mode):**
```typescript
// App runs standalone, needs API key authentication
await app.init(
  (req) => {
    // Add API key for authenticated requests
    if (process.env.API_KEY) {
      req.headers["Authorization"] = `APIKey ${process.env.API_KEY}`;
    }
    return req;
  }
);
```

---

### API Integration Patterns

**Platform API Calls:**
```typescript
// Search for products in catalog
const products = await api.portalClient()
  .getProductApi()
  .search({ name: 'GitHub' }, page, pageSize);

// Get Hub connections
const connections = await api.hubClient()
  .getConnectionApi()
  .search({ products: [productId] }, page, pageSize);

// Create resource
const resource = await api.auditmationPlatform()
  .getResourceApi()
  .create({ name: 'My Resource', type: 'custom' });
```

**Hub Module Client Usage:**
```typescript
// Use generated module client
import { GitHubClient } from '@auditlogic/module-github-github-client-ts';

const ghClient = new GitHubClient({ token: 'github-token' });
const repos = await ghClient.getRepositories('zerobias-org');
```

---

### Iframe Communication

**Send Message to Parent Portal:**
```typescript
window.parent.postMessage({
  type: 'APP_NAV',
  data: { url: '/some/path' }
}, '*');
```

**Receive Messages from Parent:**
```typescript
window.addEventListener('message', (event) => {
  if (event.data.type === 'PORTAL_HOME') {
    // Navigate to home
  } else if (event.data.type === 'LOGOUT') {
    // Handle logout
  }
});
```

**Message Types:**
- `APP_NAV` - Navigate within app
- `RESOURCE_NAV` - Navigate to resource
- `LOGOUT` - User logged out
- `REFRESH_NAVIGATION` - Refresh navigation
- `PORTAL_HOME` - Return to portal home

---

## Development Workflow

### Angular Example

```bash
cd package/zerobias/example-angular

# Install dependencies
npm install

# Start development server (http://localhost:4200)
npm start

# Build for production
npm run build

# Run tests
npm test

# Lint
npx nx lint
```

**Development Server:**
- Runs on `http://localhost:4200`
- Hot reload enabled
- Proxy configuration for API calls

---

### Next.js Example

```bash
cd package/zerobias/example-nextjs

# Install dependencies
npm install

# Start development server (http://localhost:3000)
npm run dev

# Build for specific environment
npm run build:dev
npm run build:qa
npm run build:prod

# Build with current config
npm run build

# Start production server
npm start

# Lint
npm run lint
```

**Development Server:**
- Runs on `http://localhost:3000`
- Fast Refresh enabled
- API routes at `/api/*`

**Environment Configuration:**
- `next.config.default.ts` - Local development
- `next.config.dev.ts` - Dev environment
- `next.config.qa.ts` - QA environment
- `next.config.prod.ts` - Production environment

---

## Deployment

### Build Process

**Angular:**
```bash
# Build with base href for CDN deployment
npm run build -- --base-href /example-angular/

# Output: dist/example-angular/
```

**Next.js:**
```bash
# Build for environment
npm run build:prod

# Output: .next/ (for Node.js deployment) or out/ (for static export)
```

---

### Deployment to S3 + CloudFront

**Via GitHub Actions:**
```yaml
# .github/workflows/deploy.yml
- name: Deploy to S3
  uses: auditmation/devops/actions/static-s3-app-release@main
  with:
    app-name: 'example-angular'
    environment: 'production'
    s3-bucket: 'zerobias-apps'
    cloudfront-distribution-id: ${{ secrets.CLOUDFRONT_DIST_ID }}
```

**Manual Deployment:**
```bash
# Angular
cd package/zerobias/example-angular
npm run build
aws s3 sync dist/example-angular/ s3://zerobias-apps/example-angular/
aws cloudfront create-invalidation --distribution-id <ID> --paths "/example-angular/*"

# Next.js
cd package/zerobias/example-nextjs
npm run build:prod
aws s3 sync out/ s3://zerobias-apps/example-nextjs/
aws cloudfront create-invalidation --distribution-id <ID> --paths "/example-nextjs/*"
```

---

### Iframe Embedding in Platform

**Register App in Platform:**
1. Create app record in platform database
2. Specify app URL (https://cdn.zerobias.com/apps/example-angular/)
3. Configure permissions (which orgs/users can access)
4. Add navigation entry in portal

**App URL Pattern:**
```
https://cdn.zerobias.com/apps/{app-name}/
```

**Iframe Configuration:**
```html
<iframe
  src="https://cdn.zerobias.com/apps/example-angular/"
  sandbox="allow-scripts allow-same-origin allow-forms"
  style="width: 100%; height: 100%; border: none;"
></iframe>
```

---

## Development Requirements

### System Requirements
- **Node.js**: >= 18.19.1
- **npm**: >= 10.2.4
- **Git**: >= 2.0

### Environment Variables

**Angular App:**
```bash
# .env or environment.ts
export const environment = {
  production: false,
  apiUrl: 'https://api.zerobias.com',
  portalUrl: 'https://portal.zerobias.com',
  isIframe: true
};
```

**Next.js App:**
```bash
# .env.local
NEXT_PUBLIC_API_URL=https://api.zerobias.com
NEXT_PUBLIC_PORTAL_URL=https://portal.zerobias.com
NEXT_PUBLIC_API_KEY=your-api-key  # For local dev only
NEXT_PUBLIC_IS_LOCAL_DEV=true
```

---

## Integration Points

### With Platform Services

**auditmation/zb-client:**
- Use `@auditmation/ngx-zb-client-lib` (Angular) or `@auditmation/zb-client-lib-js` (vanilla)
- Initialize client with environment config
- Make API calls to all platform services

**auditmation/ui:**
- Apps embedded as iframes in portal
- Share session context
- Communicate via postMessage
- Follow portal UI/UX guidelines

**Hub Modules:**
- Use generated TypeScript clients from Hub modules
- Examples: GitHub, Jira, AWS, etc.
- Installed via npm (`@auditlogic/module-*-client-ts`)

---

## Best Practices

### App Development

1. **Authentication:**
   - Always check authentication state before making API calls
   - Handle session expiration gracefully
   - Support both iframe and standalone modes

2. **API Calls:**
   - Use ZeroBias client library, don't call APIs directly
   - Handle errors properly (401, 403, 500)
   - Implement loading states
   - Cache data when appropriate

3. **Iframe Communication:**
   - Always validate message origin
   - Handle all message types gracefully
   - Send status updates to parent portal

4. **Performance:**
   - Lazy load routes/components
   - Optimize bundle size
   - Use CDN for static assets
   - Implement proper caching

5. **Security:**
   - Never expose API keys in client code
   - Validate all user input
   - Implement CSP headers
   - Use HTTPS only

### UI/UX Guidelines

1. **Consistency:**
   - Follow platform design patterns
   - Use platform color scheme
   - Match typography and spacing

2. **Responsiveness:**
   - Support mobile devices
   - Handle different iframe sizes
   - Test on various screen sizes

3. **Accessibility:**
   - Support keyboard navigation
   - Implement ARIA labels
   - Ensure proper contrast ratios
   - Test with screen readers

---

## Important Notes

### Iframe vs Standalone Mode

**Iframe Mode (Embedded in Portal):**
- Session inherited from parent portal
- Limited window size
- PostMessage communication
- Sandbox restrictions apply
- No custom authentication needed

**Standalone Mode (Direct Access):**
- Requires API key authentication
- Full browser window
- Independent session management
- No iframe restrictions
- Direct URL access

### Hub Module Clients

Generated TypeScript clients for Hub modules:
- Installed via npm (`@auditlogic/module-*-client-ts`)
- Type-safe API access
- Automatically generated from OpenAPI specs
- Updated when module versions change

**Example Modules:**
- `@auditlogic/module-github-github-client-ts` - GitHub API
- `@auditlogic/module-jira-jira-client-ts` - Jira API
- `@auditlogic/module-aws-aws-client-ts` - AWS API

### Build Optimization

**Angular:**
- Use production build for deployment
- Enable AOT compilation
- Implement lazy loading for routes
- Use OnPush change detection

**Next.js:**
- Use static generation where possible
- Optimize images with next/image
- Implement code splitting
- Use React Server Components (RSC)

---

## Common Issues and Solutions

### API Calls Return 401 Unauthorized

**Problem:** App can't authenticate with platform API

**Solutions:**
1. Check API key is set (standalone mode)
2. Verify iframe session is valid (iframe mode)
3. Call `whoAmI()` to establish session
4. Check CORS configuration

### Iframe Not Loading

**Problem:** App doesn't load in portal iframe

**Solutions:**
1. Check app URL is accessible
2. Verify iframe sandbox attributes
3. Check CSP headers don't block iframe
4. Test app in standalone mode first

### PostMessage Not Working

**Problem:** Messages not being sent/received between app and portal

**Solutions:**
1. Verify message origin validation
2. Check message format matches expected types
3. Test with `console.log` to debug
4. Ensure both app and portal listening for messages

### Build Fails

**Problem:** npm run build fails with errors

**Angular Solutions:**
1. Clear node_modules and reinstall
2. Check TypeScript version compatibility
3. Verify all @auditmation packages are latest
4. Run `npx nx reset` to clear cache

**Next.js Solutions:**
1. Clear .next directory
2. Check next.config.ts syntax
3. Verify environment variables set
4. Run `rm -rf .next && npm run build`

---

## Testing

### Local Testing

**Angular:**
```bash
# Run unit tests
npm test

# Run with coverage
npm test -- --code-coverage

# Run in watch mode
npm test -- --watch
```

**Next.js:**
```bash
# Run tests (if configured)
npm test

# Type checking
npx tsc --noEmit

# Lint
npm run lint
```

### Integration Testing

1. **Test in Iframe:**
   - Load portal locally
   - Embed app as iframe
   - Test postMessage communication
   - Verify session sharing

2. **Test API Calls:**
   - Point to dev environment
   - Test all API endpoints
   - Verify error handling
   - Check data transformations

3. **Test Deployment:**
   - Deploy to dev environment
   - Test CDN access
   - Verify CORS configuration
   - Check console for errors

---

## Related Documentation

- **[Root CLAUDE.md](../../CLAUDE.md)** - Meta-repo development guidance
- **[Architecture.md](../../Architecture.md)** - Platform architecture
- **[Concepts.md](../../Concepts.md)** - Domain concepts
- **[auditmation/zb-client/CLAUDE.md](../../auditmation/zb-client/CLAUDE.md)** - Client library documentation
- **[auditmation/ui/CLAUDE.md](../../auditmation/ui/CLAUDE.md)** - Portal UI
- **[auditmation/hub/CLAUDE.md](../../auditmation/hub/CLAUDE.md)** - Hub modules
- **[auditmation/devops/CLAUDE.md](../../auditmation/devops/CLAUDE.md)** - Deployment workflows
- **[package/zerobias/example-angular/README.md](package/zerobias/example-angular/README.md)** - Angular app docs
- **[package/zerobias/example-nextjs/README.md](package/zerobias/example-nextjs/README.md)** - Next.js app docs

---

## Creating New Custom Apps

### Starting a New App

**From Angular Template:**
```bash
# Copy example app
cp -r package/zerobias/example-angular package/zerobias/my-new-app

# Update package.json
cd package/zerobias/my-new-app
# Edit name, version, etc.

# Install dependencies
npm install

# Start development
npm start
```

**From Next.js Template:**
```bash
# Copy example app
cp -r package/zerobias/example-nextjs package/zerobias/my-new-app

# Update package.json
cd package/zerobias/my-new-app
# Edit name, version, etc.

# Install dependencies
npm install

# Start development
npm run dev
```

### App Checklist

- [ ] Configure authentication (iframe or standalone)
- [ ] Initialize ZeroBias client library
- [ ] Implement API calls to platform services
- [ ] Add postMessage communication (if iframe)
- [ ] Handle errors and loading states
- [ ] Implement responsive design
- [ ] Add accessibility features
- [ ] Test in both iframe and standalone modes
- [ ] Configure CI/CD deployment
- [ ] Document app features and usage

---

## Support

For custom app development questions:
1. Review example apps in this repository
2. Check ZeroBias client library documentation
3. Review Hub module client documentation
4. Test API calls in dev environment
5. Consult platform team for advanced patterns

---

**Last Updated:** 2025-11-11
**Maintainers:** ZeroBias Community
