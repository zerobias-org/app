# Dana SDK Patterns

Access via `sdk.dana`. Full API: `node_modules/@zerobias-com/dana-sdk/generated/USAGE.md`

## Authentication & Current User

```typescript
// Get current user
const user = await sdk.dana.getMeApi().whoAmI();

// Get user's organizations
const orgs = await sdk.dana.getOrgApi().list(1, 50);

// Get current org context
const currentOrg = await sdk.dana.getMeApi().getCurrentOrg();
```
