# DataProducer Backend Issue

## Problem
The SQL DataProducer implementation is not correctly populating the `PagedResults` object when returning child objects.

## Error Message
```
Error: Unexpected error: Producers must return 'items' for PagedResults queries
```

## Root Cause
In the DataProducer client library (`@auditlogic/module-auditmation-interface-dataproducer-client-ts`), the `ObjectsApiMappingImpl.getChildren()` method:

1. Creates a `PagedResults` object (called `bag`)
2. Sets pagination parameters (`pageNumber`, `pageSize`, etc.)
3. Calls `producer.getChildren(bag, objectId, type, tags)`
4. Expects the producer to populate `bag.items` with an array of child objects
5. Throws an error if `bag.items` is null or undefined

## What's Happening
The SQL DataProducer backend implementation is being called correctly, but it's not setting the `items` property on the PagedResults object that's passed to it.

## Expected Behavior
The SQL producer's `getChildren` implementation should:
```typescript
async getChildren(results: PagedResults<InlineResponse200>, objectId: string, ...) {
  // Query the database for child objects
  const children = await queryDatabase(objectId);

  // Populate the items array
  results.items = children.map(child => ({
    id: child.id,
    name: child.name,
    objectClass: child.objectClass,
    // ... other properties
  }));

  // Set pagination info
  results.count = totalCount;
  results.pageCount = Math.ceil(totalCount / results.pageSize);
}
```

## Current Behavior
The SQL producer is likely either:
- Not setting `results.items` at all
- Setting it to null/undefined
- Returning the data in a different format

## How to Reproduce
1. Connect to a SQL connection with UP or STANDBY status
2. The root object loads successfully
3. When trying to load children of the root object (which is a container), the error occurs

## Client Library Version
- `@auditlogic/module-auditmation-interface-dataproducer-client-ts`: 0.0.4-rc.0

## Fix Required
The SQL DataProducer backend implementation needs to be updated to properly populate the `PagedResults.items` array.

## Workaround
There is no client-side workaround for this issue. The backend implementation must be fixed.

## Files Affected
- Backend: SQL DataProducer implementation of `ObjectsProducerApi.getChildren()`
- Frontend: Shows user-friendly error message in `components/ObjectBrowser.tsx`
