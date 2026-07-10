# Shared session keys

A **shared session key** lets someone else act in *your* current session until it
expires. Treat it like a credential — whoever holds it inherits your access.

Demonstrated in [`CreateSharedSessionDialog`](../src/components/CreateSharedSessionDialog.tsx),
opened from the user menu ("Share Session"), mirroring the portal.

## Canonical call

```ts
import { CreateSharedSessionKeyBody } from "@zerobias-com/dana-sdk";
import { Duration } from "@zerobias-org/types-core-js";

// principalId omitted -> current user; expiration is an ISO-8601 Duration.
const body = new CreateSharedSessionKeyBody(undefined, new Duration("PT60M"));
const shared = await api.danaClient.getMeApi().createSharedSessionKey(body);
// shared.key         -> the key to hand off (returned only here)
// shared.expiration  -> DateTime the key stops working
```

List existing keys: `api.danaClient.getMeApi().listSharedSessionKeys()`.

## Two details worth copying

- **`expiration` is a `Duration`, not a timestamp.** It's ISO-8601 (`PT<minutes>M`,
  e.g. `PT60M` = 60 minutes) — build it with `new Duration(...)`, don't pass a date.
- **`key` is returned once, at creation** (like an API key's secret). It can't be
  fetched again, so surface it immediately for copying.

## Shape

`CreateSharedSessionKeyBody(principalId?: UUID, expiration?: Duration)`

`SharedSessionKey { id, sessionId, key: string, expiration: DateTime, orgId?, sharedSessionIds? }`
