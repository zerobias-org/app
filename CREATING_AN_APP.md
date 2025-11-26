# Creating a ZeroBias Application

This guide walks you through creating and deploying a custom application on the ZeroBias platform.

## Overview

The ZeroBias platform allows developers to create custom UIs that:
- ✅ Automatically get authentication (no auth code needed)
- ✅ Deploy to hosted ZeroBias infrastructure
- ✅ Access all platform capabilities and community modules
- ✅ Skip integration complexity

## Prerequisites

- Node.js >= 18.19.1
- npm >= 10.2.4
- Git
- ZeroBias platform account
- API key for local development (obtain from ZeroBias platform)

## Step 1: Fork the Repository

1. Fork this repository on GitHub: `https://github.com/zerobias-org/app`
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/app.git
   cd app
   ```

## Step 2: Choose Your Framework

Select a framework based on your needs:

### Option A: Next.js (React)
**Best for**: Modern React apps, static export, TypeScript
**Reference**: `package/zerobias/data-explorer/` (production quality)
**Example**: `package/zerobias/example-nextjs/` (shows patterns)

### Option B: Angular
**Best for**: Enterprise apps, RxJS, dependency injection
**Example**: `package/zerobias/example-angular/`

### Option C: Other Frameworks
Vue, Svelte, vanilla JS are supported as long as they:
- Support static export
- Can integrate TypeScript SDKs
- Handle authentication redirects

## Step 3: Create Your App Directory

1. Navigate to the package directory:
   ```bash
   cd package/zerobias
   ```

2. Create your app directory (use lowercase, hyphens):
   ```bash
   mkdir my-app-name
   cd my-app-name
   ```

3. Choose your `basePath` (globally unique URL path):
   - Must be unique across all ZeroBias apps
   - Will become: `https://app.zerobias.com/{basePath}`
   - Should match directory name (recommended, not required)
   - Examples: `my-app`, `compliance-dashboard`, `data-explorer`

## Step 4: Initialize Your App

### For Next.js Apps:

1. Copy from data-explorer (recommended) or example-nextjs:
   ```bash
   # From repo root
   cp -r package/zerobias/data-explorer/* package/zerobias/my-app-name/
   # Or for basic example
   cp -r package/zerobias/example-nextjs/* package/zerobias/my-app-name/
   ```

2. Update `package.json`:
   ```json
   {
     "name": "my-app-name",
     "version": "0.1.0",
     "private": true,
     ...
   }
   ```

3. Update Next.js configs (`next.config.*.ts`):
   ```typescript
   // Change basePath in ALL config files
   const nextConfig: NextConfig = {
     basePath: "/my-app-name",  // MUST be globally unique
     output: "export",
     reactStrictMode: false,
     ...
   };
   ```

4. Install dependencies:
   ```bash
   npm install
   ```

### For Angular Apps:

1. Copy from example-angular:
   ```bash
   cp -r package/zerobias/example-angular/* package/zerobias/my-app-name/
   ```

2. Update basePath in build configuration
3. Update package.json
4. Run `npm install`

## Step 5: Set Up Local Development

1. Create `.env.local` in your app directory:
   ```
   NEXT_PUBLIC_API_HOSTNAME=https://dev.zerobias.com/api
   NEXT_PUBLIC_IS_LOCAL_DEV=true
   NEXT_PUBLIC_API_KEY=your-api-key-here
   ```

2. Get your API key:
   - Log in to ZeroBias platform
   - Navigate to your organization settings
   - Generate an API key
   - See `~/zb-org/module/README.md` for private NPM authentication

3. Run development server:
   ```bash
   npm run dev
   ```

4. Access at: `http://localhost:3000`

## Step 6: Integrate ZeroBias Authentication

Your app **MUST** initialize ZeroBias authentication:

```typescript
// lib/zerobias.ts (singleton pattern - required)
import { ZerobiasClientOrgId, ZerobiasClientApp, ZerobiasClientApi } from "@auditmation/zb-client-lib-js";

class ZerobiasAppService {
  public environment = {
    isLocalDev: process.env.NEXT_PUBLIC_IS_LOCAL_DEV === 'true',
    apiHostname: process.env.NEXT_PUBLIC_API_HOSTNAME
  };

  static #instance: ZerobiasAppService;
  public zerobiasOrgId = new ZerobiasClientOrgId();
  public zerobiasClientApi = new ZerobiasClientApi(this.zerobiasOrgId, this.environment);
  public zerobiasClientApp = new ZerobiasClientApp(this.zerobiasClientApi, this.zerobiasOrgId, this.environment);

  public async initializeAppFactory() {
    await this.zerobiasClientApp.init(
      // Local dev API key injection
      (req) => {
        if (this.environment.isLocalDev && process.env.NEXT_PUBLIC_API_KEY) {
          req.headers["Authorization"] = `APIKey ${process.env.NEXT_PUBLIC_API_KEY}`;
        }
        return req;
      }
    );
  }

  public static async getInstance(): Promise<ZerobiasAppService>  {
    if (!ZerobiasAppService.#instance) {
      ZerobiasAppService.#instance = new ZerobiasAppService();
      await ZerobiasAppService.#instance.initializeAppFactory();
    }
    return ZerobiasAppService.#instance;
  }
}

export default ZerobiasAppService;
```

**How it works:**
- Checks for valid user session
- Redirects to `/login` if no session (platform handles login screen)
- Returns to your app after successful authentication
- Session management handled transparently by platform

## Step 7: Discover and Use Modules

### Finding Available Modules:

1. **Use the Catalog App** on ZeroBias platform
   - Browse all available modules, schemas, queries, etc.
   - View module documentation and examples
   - Check compatibility and versions

2. **Module Types:**
   - **ZeroBias Core Modules**: `~/code/module` → Public NPM
   - **Community Modules**: `~/zb-org/module` → Private NPM (requires auth)

### Installing a Module:

```bash
# Public module example
npm install @auditlogic/module-github-github-client-ts

# Private module - configure npm first
# See ~/zb-org/module/README.md for authentication
npm install @zerobias-org/module-name
```

### Using a Module:

```typescript
import { newGithub } from '@auditlogic/module-github-github-client-ts';
import { URL as CoreURL, UUID } from '@auditmation/types-core-js';

// 1. Get connection from ZeroBias Hub
const zerobiasService = await ZerobiasAppService.getInstance();
const connectionApi = zerobiasService.zerobiasClientApi.hubClient.getConnectionApi();
const connections = await connectionApi.list(1, 50);

// 2. Create Hub connection profile
const hubProfile = {
  server: new CoreURL(`${apiHostname}/hub`),
  targetId: new UUID(connectionId) // or scopeId for multi-scope connections
};

// 3. Initialize module client
const githubClient = newGithub();
await githubClient.connect(hubProfile);

// 4. Use module APIs
const orgs = await githubClient.getOrganizationsApi().listMyOrganizations();
```

## Step 8: Build Your UI

Focus on your unique functionality. The platform provides:
- ✅ Authentication
- ✅ User/org management
- ✅ Connection management
- ✅ Module SDKs

You provide:
- ✅ Custom UI/UX
- ✅ Business logic
- ✅ Data visualization
- ✅ User workflows

**Best Practices:**
- Study `data-explorer` for production patterns
- Use TypeScript strict mode
- Implement proper error handling
- Add loading states
- Consider accessibility
- See `package/zerobias/data-explorer/CLAUDE.md` for detailed guidance

## Step 9: Test Locally

1. Run development server:
   ```bash
   npm run dev
   ```

2. Test authentication flow:
   - Clear cookies/session
   - Navigate to your app
   - Verify redirect to login
   - Verify return after login

3. Test module integration:
   - Connect to a test connection
   - Verify API calls work
   - Test error handling

4. Test build:
   ```bash
   npm run build:dev
   npm start
   ```

## Step 10: Deploy to ZeroBias Platform

### Development Deployment:

1. Create a branch for dev deployment:
   ```bash
   git checkout -b dev
   ```

2. Commit your app:
   ```bash
   git add package/zerobias/my-app-name
   git commit -m "Add my-app-name application"
   git push origin dev
   ```

3. Create Pull Request:
   - Target: `dev` branch
   - Title: "Add my-app-name application"
   - Description: Include:
     - App purpose
     - basePath: `/my-app-name`
     - Dependencies (modules used)
     - Any special requirements

4. PR Review Process:
   - Platform team reviews
   - Checks basePath uniqueness
   - Verifies no naming conflicts
   - Validates build configuration
   - May request changes

5. Merge triggers deployment:
   - Auto-deploys to: `https://dev.zerobias.com/my-app-name`
   - Available immediately after merge

### QA Deployment:

1. Create PR targeting `qa` branch
2. Same review process
3. Deploys to: `https://qa.zerobias.com/my-app-name`

### Production Deployment:

1. Create PR targeting `main` or `master` branch
2. More rigorous review
3. Deploys to: `https://app.zerobias.com/my-app-name`

## Step 11: Verify Deployment

1. Wait for deployment (usually < 5 minutes)
2. Access your app at appropriate URL
3. Test authentication flow (uses platform login)
4. Verify all functionality works
5. Check browser console for errors

## Common Issues & Solutions

### Issue: "basePath conflict"
**Solution**: Choose a different, globally unique basePath

### Issue: "Failed to authenticate"
**Solution**:
- Ensure `ZerobiasAppService.init()` is called
- Check environment variables are set correctly
- Verify API key is valid (local dev)

### Issue: "Module not found"
**Solution**:
- Verify module is installed: `npm list @module/name`
- Check private NPM authentication (see `~/zb-org/module/README.md`)
- Ensure module is compatible with your app framework

### Issue: "Static export failed"
**Solution**:
- Remove any server-side rendering (SSR) code
- Remove API routes (use ZeroBias APIs instead)
- Ensure all data fetching happens client-side

### Issue: "Build succeeds locally but fails in PR"
**Solution**:
- Check Node/npm versions match platform requirements
- Verify all dependencies are in package.json
- Remove any local-only configuration

## Next Steps

- **Read**: `package/zerobias/data-explorer/CLAUDE.md` for best practices
- **Review**: Example apps for integration patterns
- **Explore**: ZeroBias Catalog for available modules
- **Join**: ZeroBias community for support

## Resources

- **Platform Documentation**: https://docs.zerobias.com
- **Module Catalog**: Available in ZeroBias platform UI
- **Private NPM Auth**: `~/zb-org/module/README.md`
- **DataProducer Interface**: `~/code/module/package/auditmation/interface/dataproducer/README.md`
- **Community**: https://github.com/zerobias-org

## Getting Help

- **Issues**: Create GitHub issue in this repository
- **Questions**: Use GitHub Discussions
- **Security**: Contact security@zerobias.com
- **General**: support@zerobias.com
