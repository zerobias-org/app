# CLAUDE.md - Data Explorer

This file provides project-specific guidance for the Data Explorer application.

**Note**: This file is supplemental to `README.md`. For deployment and getting started, see README first.

## Purpose

Data Explorer is a **production-ready, reference implementation** for building UIs on the ZeroBias platform. It provides a visual interface for browsing and exploring data sources through the DataProducer interface.

### What is DataProducer?

The **DataProducer interface** is a generic, object-oriented abstraction for data sources defined at `~/code/module/package/auditmation/interface/dataproducer`. It enables unified access to:
- File systems and folder structures
- Database schemas and tables
- REST APIs and functions
- Document stores
- Low-code/no-code platforms (Spreadsheets, Zoho, Salesforce, GRC tools)

**Key Concept**: DataProducer provides a tree-based navigation model where objects can be containers (folders/schemas), collections (tables/lists), functions (APIs/procedures), documents (structured data), or binary files.

**Read First**: `~/code/module/package/auditmation/interface/dataproducer/README.md` for complete interface specification.

### Data Explorer Capabilities

This UI enables users to:

- Browse database objects in a hierarchical tree structure
- View and filter collection data with RFC4515 queries
- Inspect table schemas and metadata
- Execute database functions
- Generate entity-relationship diagrams (ERDs)
- Work with multiple database connections and scopes

This is a focused, production-quality application with a clean architecture and modern UI/UX.

### Who Uses This App?

Data Explorer is available to **anyone consuming a DataProducer-compatible data source**, including:
- Database administrators browsing SQL databases (PostgreSQL, MySQL, SQL Server)
- Data analysts exploring spreadsheets and GRC platforms
- Developers testing REST APIs and functions
- Security teams reviewing file systems and documents
- Anyone needing to browse/query data through a DataProducer implementation

**Wide Applicability**: Because DataProducer is a generic interface, this single UI works with any compatible data source - databases, file systems, APIs, low-code platforms, etc.

## Project Structure

```
data-explorer/
├── app/
│   ├── page.tsx              # Main data explorer interface
│   ├── layout.tsx            # Root layout with context providers
│   ├── not-found.tsx         # 404 page
│   ├── globals.css           # Global CSS
│   └── api/
│       └── proxy/[...path]/  # API proxy for CORS in local dev
├── components/
│   ├── ConnectionSelector.tsx    # Connection/scope picker
│   ├── ObjectBrowser.tsx        # Tree navigation
│   ├── ObjectDetails.tsx        # Tabbed detail view
│   ├── CollectionViewer.tsx     # Data table with filtering
│   ├── SchemaViewer.tsx         # Schema metadata display
│   ├── FunctionInvoker.tsx      # Function execution UI
│   ├── ERDiagram.tsx           # Mermaid ERD generation
│   └── Loading.tsx             # Loading spinner
├── context/
│   ├── CurrentUserContext.tsx     # Zerobias auth/org state
│   └── DataExplorerContext.tsx   # DataProducer client state
├── lib/
│   ├── zerobias.ts           # Zerobias service singleton
│   ├── types.ts              # Type definitions
│   └── utils.ts              # Helper functions
├── styles/
│   └── styles.scss           # SCSS styles
└── next.config.*.ts          # Environment-specific configs
```

## Architecture

### Design Philosophy

**Clean Architecture Principles:**
- ✅ **No unnecessary wrappers** - API clients called directly from contexts/components
- ✅ **Singleton for globals** - `ZerobiasAppService` manages platform client lifecycle
- ✅ **State for instances** - Per-connection DataProducer clients in React state
- ✅ **Separation of concerns** - Clear boundaries between auth, connection management, and data access
- ✅ **Modern UI patterns** - Resizable panels, custom tabs, proper error handling

### State Management

**Two Context Providers:**

1. **CurrentUserContext** (`context/CurrentUserContext.tsx`)
   - Manages Zerobias authentication and organization
   - Subscribes to `getWhoAmI()` and `getCurrentOrg()` observables
   - Provides: `user`, `org`, `loading`
   - Initialized once per app lifecycle

2. **DataExplorerContext** (`context/DataExplorerContext.tsx`)
   - Manages DataProducer client instances (per-connection)
   - Tracks selected connection, scope, and object
   - Provides: `dataProducerClient`, `selectedConnection`, `selectedScope`, `selectedObject`
   - Creates new client when connection/scope changes
   - **Key method**: `initializeDataProducer(targetId)` - connects to specific database

**Why Two Contexts?**
- Separation of concerns: auth vs data access
- Different lifecycles: user is global, DataProducer is per-connection
- Avoids prop drilling while maintaining clear boundaries

### Service Architecture

**ZerobiasAppService (lib/zerobias.ts):**
- **Purpose**: Singleton managing Zerobias platform client libraries
- **Pattern**: Classic singleton with private constructor and `getInstance()`
- **Responsibilities**:
  - Initialize Zerobias clients once per app
  - Provide axios interceptor for local dev (API key injection)
  - Centralize environment configuration
  - Expose `zerobiasClientApi` for platform API access

**Why Singleton Here?**
- Global platform clients shared across entire app
- Single authentication session
- One-time initialization with interceptors
- Environment config accessed from multiple places

**No DataProducer Wrapper:**
- DataProducer clients managed directly in `DataExplorerContext`
- Each connection gets its own client instance
- Clients stored in React state, not a service wrapper
- Direct API calls: `dataProducerClient.getObjectsApi().getObject(id)`

### Component Architecture

**ConnectionSelector:**
- Discovers connections implementing DataProducer interface
- Handles single-scope vs multi-scope connection detection
- Auto-initializes when single scope available
- Provides dropdown UI for user selection

**ObjectBrowser:**
- Tree structure with lazy-loading (load children on expand)
- Handles root-level and nested object browsing
- Displays object classification badges
- Highlights selected object
- Supports pagination for large result sets

**ObjectDetails:**
- Tabbed interface with custom styling
- Dynamically shows tabs based on object type:
  - **Metadata**: All objects
  - **Data**: Collections (tables/views)
  - **Function**: Executable functions
  - **Schema**: Collections with schema metadata
  - **ERD**: Collections (entity-relationship diagram)

**CollectionViewer:**
- Table and JSON view modes
- RFC4515 filter builder with operators (=, ~=, >=, <=, *)
- Column autocomplete in filter builder
- Pagination (count-based or cursor-based)
- Handles both simple and complex data types

**SchemaViewer:**
- Summary stats (total properties, primary keys, required fields)
- Table with icons for primary keys, required/optional, multi-valued
- Data type badges with format information
- Foreign key references display
- Legend explaining icons
- Collapsible raw JSON viewer

**ERDiagram:**
- Attempts to fetch from DataProducer diagram API
- Falls back to generating from schema JSON
- Mermaid.js rendering with error handling
- Toggle between visual diagram and source code
- Responsive sizing and zoom/pan (provided by Mermaid)

**FunctionInvoker:**
- Dynamic form generation from input schema
- JSON input for complex parameters
- Output display with formatting
- Error handling for failed invocations

## UI/UX Design

### Layout

**Split-Pane Design:**
- Uses `react-resizable-panels` for professional drag-to-resize
- Left panel: Object Browser (20-50% width)
- Right panel: Object Details (minimum 40% width)
- Smooth drag handle with hover effects
- Independent scrolling per panel

**Color Scheme:**
- Primary: Purple gradient (`#667eea` to `#764ba2`)
- Accents: Blue (`#2563eb`) for interactive elements
- Neutral: Gray scales for backgrounds and borders
- Success/Warning/Error: Semantic colors

**Typography:**
- Headers: Semi-bold, clear hierarchy
- Body: Regular weight, readable sizes
- Code/Data: Monospace font for technical content

**Custom Tab Styling:**
- Replaced default `react-tabs` styling
- Purple underline for active tab
- Smooth hover transitions
- Proper focus states for accessibility

### User Experience Features

1. **Progressive Disclosure**: Show complexity only when needed
2. **Empty States**: Helpful messages guiding user actions
3. **Loading States**: Spinners with descriptive text
4. **Error Handling**: User-friendly error messages with retry options
5. **Responsive**: Works on various screen sizes
6. **Keyboard Accessible**: Proper focus management

## DataProducer Integration

### Connection Discovery

The app discovers DataProducer connections through multiple strategies:

```typescript
// 1. Primary: Find via PostgreSQL product association
const pgProducts = await productApi.search({ packageCode: POSTGRESQL_PRODUCT_KEY });
const modules = await moduleApi.search({ products: [pgProduct.id] });
const connections = await connectionApi.search({ modules: moduleIds });

// 2. Fallback: Name-based filtering (sql, postgres, database keywords)
const allConnections = await connectionApi.list();
const sqlConnections = connections.filter(c => c.name.match(/sql|postgres|database/i));

// 3. Last resort: Show all connections
```

### Scope Handling

```typescript
// Check if connection is multi-scope
const connection = await connectionApi.get(connectionId);

if (connection.scoped) {
  // Multi-scope: List scopes and let user choose
  const scopes = await scopeApi.list(connectionId, page, pageSize);
  // Initialize with scope ID
  await initializeDataProducer(scopeId);
} else {
  // Single-scope: Use connection ID directly
  await initializeDataProducer(connectionId);
}
```

### Client Initialization

```typescript
// Build Hub connection profile
const apiHostname = process.env.NEXT_PUBLIC_API_HOSTNAME || 'https://ci.zerobias.com/api';
const hubUrl = `${apiHostname}/hub`;

const hubConnectionProfile = {
  server: new URL(hubUrl),
  targetId: new UUID(targetId) // connection or scope ID
};

// Create and connect client
const client = newDataproducer();
await client.connect(hubConnectionProfile);

// Store in React state
setDataProducerClient(client);
```

### Object Navigation

```typescript
// Get root objects
const rootChildren = await client.getObjectsApi()
  .getRootChildObjects(page, pageSize);

// Get child objects
const children = await client.getObjectsApi()
  .getChildObjects(parentId, page, pageSize);

// Get full object details
const object = await client.getObjectsApi()
  .getObject(objectId);
```

### Collection Queries

```typescript
// Query collection data with optional RFC4515 filter
const filters = ['(name=John)', '(age>=18)']; // Array of filter strings
const result = await client.getCollectionsApi()
  .getCollectionElements(collectionId, page, pageSize, filters);

// Result contains:
// - items: Array of data rows
// - count: Total count (if count-based pagination)
// - pageToken: Next page token (if cursor-based)
// - pageCount: Total pages (if count-based)
```

### Schema Access

```typescript
// Get schema for collection
const schema = await client.getSchemasApi()
  .getSchema(collectionId);

// Schema contains:
// - properties: Array of column definitions
// - dataTypes: Supported data types
// - primaryKey, required, multi, references, etc.
```

### Function Invocation

```typescript
// Invoke function with input
const input = { param1: 'value1', param2: 42 };
const output = await client.getFunctionsApi()
  .invoke(functionId, input);
```

### ERD Generation

```typescript
// Try to get ERD from API (if supported)
const diagramApi = client.getDiagramApi();
const erdResult = await diagramApi.getERD(objectId);

// Or generate from schema
const schema = JSON.parse(schemaJson);
const mermaidCode = generateERDFromSchema(schema);
```

## Development

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create `.env.local` for local development:**
   ```
   NEXT_PUBLIC_API_HOSTNAME=https://your-api-host/api
   NEXT_PUBLIC_IS_LOCAL_DEV=true
   NEXT_PUBLIC_API_KEY=your-api-key-here
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Access at:**
   ```
   http://localhost:3000
   ```

### Build

```bash
# Development build
npm run build:dev

# QA build
npm run build:qa

# Production build
npm run build:prod

# Run production server
npm start
```

### Environment Variables

**Required:**
- `NEXT_PUBLIC_API_HOSTNAME` - Zerobias API endpoint (e.g., `https://ci.zerobias.com/api`)

**Optional (Local Development):**
- `NEXT_PUBLIC_IS_LOCAL_DEV` - Set to `"true"` to enable local dev mode
- `NEXT_PUBLIC_API_KEY` - API key for authentication (only used if IS_LOCAL_DEV=true)

**Other:**
- `NEXT_PUBLIC_PRODUCTION` - Set to `"true"` for production builds

### Configuration Files

The app uses different Next.js configs for each environment:

- `next.config.default.ts` - Default for local dev
- `next.config.dev.ts` - Development environment
- `next.config.qa.ts` - QA environment
- `next.config.prod.ts` - Production environment

Build scripts (`npm run build:dev`, etc.) copy the appropriate config to `next.config.ts` before building.

**Common Settings:**
- Output: `"export"` (static export)
- Base path: `"/data-explorer"`
- React strict mode: Disabled (for compatibility)

## Best Practices

### ✅ DO

1. **Use direct API calls** - Call DataProducer APIs directly, no wrappers
2. **Manage state properly** - Per-connection clients in React state, not services
3. **Handle errors gracefully** - Show user-friendly messages with retry options
4. **Implement loading states** - Clear feedback during async operations
5. **Type everything** - Leverage TypeScript types from client libraries
6. **Keep components focused** - Single responsibility, clear boundaries
7. **Test pagination edge cases** - Handle both count-based and cursor-based
8. **Support various data types** - Arrays, objects, dates, nulls, etc.
9. **Provide empty states** - Guide users when no data available

### ❌ DON'T

1. **Don't create wrapper services** - For per-instance clients like DataProducer
2. **Don't ignore loading states** - Always show feedback during operations
3. **Don't skip error handling** - Network calls can fail
4. **Don't hardcode assumptions** - Support both single and multi-scope connections
5. **Don't forget pagination** - Large datasets require paging
6. **Don't use inline styles everywhere** - Use CSS modules or styled components
7. **Don't ignore accessibility** - Keyboard navigation, ARIA labels, etc.
8. **Don't skip TypeScript types** - Use `any` sparingly

## Troubleshooting

### "No connections found"

**Causes:**
- No DataProducer connections configured in Zerobias
- Product/module associations not set up correctly
- Connection is DOWN or in invalid state

**Solutions:**
1. Check connection status in Zerobias admin
2. Verify module implements DataProducer interface
3. Check product associations are correct
4. Review console logs for discovery details

### "Failed to load object details"

**Causes:**
- Invalid object ID
- Backend DataProducer not responding
- Network issues

**Solutions:**
1. Check browser console for error details
2. Verify connection is UP
3. Try refreshing the connection selector
4. Check API endpoint is reachable

### "Producers must return 'items' for PagedResults queries"

**Cause:**
- Known backend issue where DataProducer doesn't populate `items` array correctly

**Solution:**
- This is a backend issue being addressed
- The frontend handles it gracefully with error messages
- See `BACKEND_ISSUE.md` for details

### Filter not working

**Causes:**
- Invalid RFC4515 syntax
- Backend doesn't support filtering on specific column
- Data type mismatch

**Solutions:**
1. Use the filter builder UI instead of typing manually
2. Check RFC4515 syntax: `(attribute=value)`
3. Ensure attribute name matches column name exactly
4. Some backends may have limited filter support

## Future Enhancements

Potential improvements for future development:

### Phase 4: Polish & UX
- **Dark mode** - Toggle between light and dark themes
- **Keyboard shortcuts** - `Ctrl+K` for search, `/` for filter
- **Tree search** - Filter ObjectBrowser by name
- **Breadcrumb navigation** - Show current location in hierarchy
- **Connection status** - Real-time indicator of connection health

### Advanced Features
- **Query builder** - Visual query builder beyond simple filters
- **Export data** - CSV, JSON, Excel export options
- **Favorites/Bookmarks** - Save frequently accessed objects
- **History** - Track recently viewed objects
- **Multiple connections** - Work with multiple databases simultaneously
- **Custom views** - Save filter/column configurations

### Performance
- **Virtual scrolling** - Handle very large datasets efficiently
- **Caching** - Cache object metadata to reduce API calls
- **Optimistic UI** - Show changes immediately, sync in background

## Contributing

When contributing to Data Explorer:

1. **Maintain clean architecture** - No unnecessary wrappers or abstractions
2. **Follow existing patterns** - Consistent with current codebase
3. **Write TypeScript** - Proper types, no `any` unless necessary
4. **Test thoroughly** - Especially pagination and error cases
5. **Update docs** - Keep this file current with changes
6. **Consider accessibility** - Keyboard nav, screen readers, ARIA
7. **Match design system** - Purple theme, consistent spacing
8. **Handle errors gracefully** - User-friendly messages

## Resources

- **DataProducer Interface Docs**: [Link to API documentation]
- **Zerobias Platform**: https://zerobias.com
- **Zerobias Client Library**: `@auditmation/zb-client-lib-js`
- **DataProducer Client**: `@auditlogic/module-auditmation-interface-dataproducer-client-ts`
- **RFC4515 Filter Syntax**: https://www.rfc-editor.org/rfc/rfc4515.html
- **Mermaid Diagrams**: https://mermaid.js.org/

## Related Documentation

- **Repository overview**: `/CLAUDE.md` (repo root)
- **Example patterns**: `../example-nextjs/CLAUDE.md`
- **Backend issues**: `./BACKEND_ISSUE.md` (if present)
