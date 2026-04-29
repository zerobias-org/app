# Common SDK Patterns

## SDK Initialization (Server-Side)

```typescript
import { newZerobiasSdk } from '@zerobias-com/zerobias-sdk';
import { SdkConnectionProfile, URL as ZbURL, UUID } from '@zerobias-org/types-core-js';

async function getConnectedSdk() {
  const sdk = newZerobiasSdk();
  const url = new ZbURL(process.env.NEXT_PUBLIC_API_HOSTNAME!);
  const connectionProfile = new SdkConnectionProfile(
    url,
    process.env.NEXT_PUBLIC_API_KEY,
    undefined,
    process.env.NEXT_PUBLIC_DEFAULT_ORG_ID as unknown as UUID
  );
  await sdk.connect(connectionProfile);
  return sdk;
}
// Remember: await sdk.disconnect() when done
```

## Error Handling

```typescript
import { CoreError } from '@zerobias-org/types-core-js';

try {
  const result = await sdk.platform.getBoundaryApi().get(id);
} catch (error) {
  if (error instanceof CoreError) {
    if (error.status === 404) { /* Not found */ }
    if (error.status === 403) { /* No access */ }
  }
}
```

## Pagination

```typescript
import { PagedResults } from '@zerobias-org/types-core-js';

async function fetchAllPages<T>(
  fetcher: (page: number, size: number) => Promise<PagedResults<T>>,
  pageSize = 50
): Promise<T[]> {
  const all: T[] = [];
  let page = 1, hasMore = true;
  while (hasMore) {
    const result = await fetcher(page, pageSize);
    all.push(...result.results);
    hasMore = result.results.length === pageSize;
    page++;
  }
  return all;
}
```

## Important Notes

1. **Boundaries are read-only in SME Mart** - Creation happens in ZB Platform
2. **All engagement assets get the engagement Tag** - Enables Transparency Center aggregation
3. **Comments = Messages** - TC messaging built on ZB Comments with engagement tag
4. **Check USAGE.md for full API** - These are common patterns, not comprehensive docs
