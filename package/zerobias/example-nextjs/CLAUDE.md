# CLAUDE.md - NextJS Example Application

This file provides project-specific guidance for the NextJS example application.

**Note**: This file is supplemental to `README.md`. For deployment and getting started, see README first.

## Purpose

This is an **educational demo application** that showcases integration patterns with the Zerobias platform. It is **intentionally flawed** - showing functional patterns but not production-quality implementation. It demonstrates:
- User authentication and organization management
- Product catalog browsing
- Module discovery and connection management
- External service integration (GitHub as example)
- Principal Key-Value storage (PKV) operations
- API key and session key management

**Note**: This is intentionally a demo/example application, not production code. Its purpose is to illustrate integration patterns, not to provide a polished user experience.

## Project Structure

```
example-nextjs/
├── app/
│   ├── page.tsx              # Landing page with demo navigation
│   ├── layout.tsx            # Root layout with context providers
│   ├── not-found.tsx         # 404 page
│   ├── products-demo/        # Product catalog demo
│   ├── module-demo/          # GitHub module integration demo
│   └── pkv-demo/             # Principal Key-Value storage demo
├── components/
│   ├── demos/                # Demo-specific components
│   │   ├── ProductsDemo.tsx
│   │   ├── ModuleDemo.tsx
│   │   └── PKV.tsx
│   ├── forms/                # Form components
│   │   ├── FormCreateApiKey.tsx
│   │   └── FormCreateSharedSecret.tsx
│   └── ui/                   # UI components
│       ├── appToolbar.tsx
│       ├── mainMenu.tsx
│       └── mainTabs.tsx
├── context/
│   └── CurrentUserContext.tsx # Global user/org state
├── lib/
│   ├── zerobias.ts           # Zerobias service singleton
│   └── types.ts              # Type definitions
└── styles/
    └── styles.scss           # Global styles
```

## Architecture

### State Management

**Global State (CurrentUserContext):**
- Wraps entire application in `app/layout.tsx`
- Provides: `user`, `org`, `loading`, `action`, `setOrg`, `setAction`
- Subscribes to Zerobias observables: `getWhoAmI()`, `getCurrentOrg()`
- `action` state controls modal display (e.g., "createApiKey", "createSharedSessionKey")

**Zerobias Service Singleton:**
- `lib/zerobias.ts` exports `ZerobiasAppService` class
- Singleton pattern via `getInstance()` method
- Initializes Zerobias client libraries once per app lifecycle
- Provides axios interceptor for local dev API key injection
- Centralizes environment configuration

### Integration Patterns

**Product Catalog (products-demo):**
```typescript
// 1. Get products API
const productApi = zerobiasService.zerobiasClientApi.portalClient.getProductApi();

// 2. Search or list products
const products = await productApi.search({ packageCode: 'some.package' }, page, pageSize);
// or
const products = await productApi.list(page, pageSize);

// 3. Display product details
```

**Module & Connection Flow (module-demo):**
```typescript
// 1. Find product (e.g., GitHub)
const products = await productApi.search({ packageCode: 'github.github' }, 1, 10);
const githubProduct = products.items[0];

// 2. Find modules using that product
const modules = await moduleApi.search({ products: [githubProduct.id] }, 1, 50);

// 3. Find connections implementing those modules
const connections = await connectionApi.search({ modules: moduleIds }, 1, 50);

// 4. Get connection scopes (if multi-scope)
const scopes = await scopeApi.list(connectionId, 1, 50);

// 5. Initialize module client with Hub connection profile
const hubProfile = {
  server: new URL(apiHostname + '/hub'),
  targetId: new UUID(scopeId) // or connectionId if single-scope
};
const githubClient = newGithub();
await githubClient.connect(hubProfile);

// 6. Use external API
const orgs = await githubClient.getOrganizationsApi().listMyOrganizations();
```

**PKV Storage (pkv-demo):**
```typescript
// Get PKV API
const pkvApi = zerobiasService.zerobiasClientApi.danaClient.getPkvApi();

// List keys
const keys = await pkvApi.list(page, pageSize);

// Get value
const value = await pkvApi.get(key);

// Set value
await pkvApi.set(key, value, ttl);

// Delete
await pkvApi.delete(key);
```

## Development

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env.local` for local development:
   ```
   NEXT_PUBLIC_API_HOSTNAME=https://your-api-host/api
   NEXT_PUBLIC_IS_LOCAL_DEV=true
   NEXT_PUBLIC_API_KEY=your-api-key-here
   ```

3. Run development server:
   ```bash
   npm run dev
   ```

4. Access at: `http://localhost:3000`

### Build

```bash
# Development build
npm run build:dev

# QA build
npm run build:qa

# Production build
npm run build:prod
```

Build scripts copy environment-specific config (`next.config.dev.ts`, etc.) to `next.config.ts` before building.

### Environment Variables

- `NEXT_PUBLIC_API_HOSTNAME` - Zerobias API endpoint (required)
- `NEXT_PUBLIC_IS_LOCAL_DEV` - Enable local dev mode (optional, boolean string)
- `NEXT_PUBLIC_API_KEY` - API key for local dev authentication (optional, only used if IS_LOCAL_DEV=true)
- `NEXT_PUBLIC_LOCAL_PORTAL_ORIGIN` - Portal origin for redirects (optional)

## Known Gaps and Future Improvements

This section documents known issues and areas where the example could be improved. These are captured here for future reference and to help developers understand what NOT to copy into production code.

**Status**: Documented for future improvement. Use `data-explorer` as reference for production-quality implementations instead.

### 1. Remove Unnecessary Wrapper Services

**Current Issue:**
The app doesn't have major wrapper service issues, but the `zerobias.ts` service could be streamlined.

**Suggestion:**
- Review `ZerobiasAppService.environment` object - remove unused properties (`socketUrlPath`, `localPortalOrigin` if not used)
- Consider removing the `enable` flag if it's not actually checked anywhere
- Document which properties are required vs optional

### 2. Improve UI/UX Design

**Current Issue:**
The UI is functional but minimal - plain layouts, basic styling, no cohesive design system.

**Suggestions:**
- Adopt a modern UI library (shadcn/ui, Radix UI, or similar)
- Implement a consistent design system with:
  - Color palette and theme variables
  - Typography scale
  - Spacing system
  - Component library
- Replace inline styles with proper CSS modules or styled-components
- Add proper loading skeletons instead of generic "Loading..." text
- Implement error boundaries with user-friendly error messages
- Add empty states with helpful guidance

### 3. Refactor Modal Management

**Current Issue:**
The `action` state in `CurrentUserContext` is used to control modals globally, which tightly couples UI concerns with auth state.

**Suggestions:**
- Create a separate `ModalContext` or use a modal library (react-modal, Radix Dialog)
- Move modal-related state out of `CurrentUserContext`
- Use a modal manager pattern or portal-based approach

### 4. Improve Component Structure

**Current Issue:**
- Large monolithic demo components (`ProductsDemo.tsx`, `ModuleDemo.tsx`)
- Mixing concerns (data fetching, state, UI rendering)
- Difficult to test and reuse

**Suggestions:**
- Break down large components into smaller, focused components
- Separate data fetching logic into custom hooks
- Extract reusable UI components
- Example structure:
  ```
  components/
  ├── products/
  │   ├── ProductList.tsx
  │   ├── ProductCard.tsx
  │   ├── ProductSearch.tsx
  │   └── useProducts.ts  // Custom hook
  ├── connections/
  │   ├── ConnectionList.tsx
  │   ├── ConnectionCard.tsx
  │   └── useConnections.ts
  └── common/
      ├── LoadingSpinner.tsx
      ├── ErrorMessage.tsx
      └── EmptyState.tsx
  ```

### 5. Add Proper Error Handling

**Current Issue:**
Errors are often caught but not gracefully handled or displayed to users.

**Suggestions:**
- Implement consistent error handling pattern
- Create reusable error display components
- Add retry mechanisms for failed requests
- Log errors appropriately (consider error tracking service)
- Provide contextual error messages ("Failed to load products" vs generic errors)

### 6. Implement Loading States Pattern

**Current Issue:**
Inconsistent loading state management across components.

**Suggestions:**
- Create a consistent loading state pattern
- Use skeleton screens instead of spinners where appropriate
- Implement optimistic UI updates where possible
- Consider using React Query or SWR for better data fetching patterns

### 7. Add TypeScript Strict Mode

**Current Issue:**
May not be using TypeScript to its full potential.

**Suggestions:**
- Enable `strict: true` in `tsconfig.json`
- Remove `any` types - leverage provided types from Zerobias libraries
- Add proper type definitions for all props and state
- Use discriminated unions for state machines (e.g., loading/error/success states)

### 8. Implement Routing Best Practices

**Current Issue:**
Simple page-based routing without navigation state management.

**Suggestions:**
- Add breadcrumb navigation
- Implement proper back/forward navigation
- Consider adding URL query parameters for filters/pagination
- Add loading states during route transitions
- Implement proper 404 handling with helpful navigation

### 9. Add Testing

**Current Issue:**
No tests present in the repository.

**Suggestions:**
- Add unit tests for utility functions and hooks
- Add component tests with React Testing Library
- Add integration tests for key user flows
- Consider E2E tests with Playwright or Cypress
- Aim for meaningful test coverage of critical paths

### 10. Improve Accessibility

**Current Issue:**
Minimal accessibility considerations.

**Suggestions:**
- Add proper ARIA labels and roles
- Ensure keyboard navigation works throughout
- Test with screen readers
- Maintain proper heading hierarchy
- Add focus management for modals and navigation
- Ensure sufficient color contrast
- Add skip links for keyboard users

### 11. Add Documentation

**Current Issue:**
Limited inline documentation.

**Suggestions:**
- Add JSDoc comments for key functions and components
- Document integration patterns with examples
- Create a README with setup instructions
- Document environment variables and configuration
- Add storybook for component documentation (optional)

### 12. Security Considerations

**Current Issue:**
API keys in environment variables could be exposed.

**Suggestions:**
- Ensure API keys are never committed to source control
- Add `.env.local` to `.gitignore` (should already be there)
- Consider using a backend-for-frontend (BFF) pattern to hide API keys
- Implement proper CSP headers
- Validate and sanitize all user inputs
- Be cautious with XSS when rendering user-generated content

## Differences from data-explorer

The `data-explorer` project is a good example of many of these improvements already implemented:

**What data-explorer does well:**
- ✅ Clean architecture without unnecessary wrappers
- ✅ Modern UI with proper design system (purple gradient theme)
- ✅ Professional split-pane layout with resizable panels
- ✅ Consistent component structure and organization
- ✅ Proper error handling and loading states
- ✅ Focused purpose (database exploration)
- ✅ Custom styled tabs instead of default library styles

**What example-nextjs is:**
- An educational demo showing integration patterns
- Intentionally simple to make patterns clear
- Not concerned with production-ready UI/UX
- Demonstrates multiple integration scenarios in one app

If building a production application, use `data-explorer` as the architectural reference, not `example-nextjs`.

## When to Use This Example

**✅ Use example-nextjs as reference for:**
- Learning Zerobias platform integration patterns
- Understanding authentication flow
- Seeing how to work with product catalog
- Learning connection and scope management
- Understanding module client initialization
- PKV storage operations

**❌ Don't use example-nextjs as reference for:**
- UI/UX design
- Component architecture for production apps
- State management patterns
- Error handling approaches
- Testing strategies

For production applications, start with the patterns from `data-explorer` and adapt them to your specific use case.

## Additional Resources

- **Zerobias Platform Documentation**: [URL if available]
- **DataProducer Interface**: See `data-explorer` for comprehensive example
- **GitHub Module Client**: https://github.com/auditlogic/module-github-github-client-ts
- **Zerobias Client Library**: `@auditmation/zb-client-lib-js` package docs

## Contributing

When contributing to this example:

1. **Keep it simple** - This is an educational example, not a showcase app
2. **Focus on patterns** - Demonstrate integration patterns clearly
3. **Add comments** - Explain why, not just what
4. **Update this doc** - Document new patterns or changes
5. **Don't over-engineer** - Resist the urge to add too many abstractions

Remember: The goal is to teach integration patterns, not to build the perfect app.
