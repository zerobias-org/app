# zerobias-org/types - Quick Reference

## What It Is

`@zerobias-org/types-core-js` is a **primitive type validation library** for ZeroBias platform. It provides:
- **Validated type classes:** UUID, DateTime, Email, Duration, MimeType, etc.
- **Error classes:** InvalidInputError, NotFoundError, ConflictError, etc.
- **Utilities:** PagedResults pagination wrapper, PropertySelector

**What it is NOT:**
- NOT a domain model library (no WorkRequest, Proposal, ServiceOffering, etc.)
- NOT SME Mart-specific (used across all ZeroBias apps)

---

## When to Use zerobias-org/types

### ✅ USE for:

**ID fields:**
```typescript
id: UUID                           // Not: id: string
buyer_zerobias_user_id: UUID      // Not: buyer_zerobias_user_id: string
zerobias_tag_id: UUID | null      // Not: zerobias_tag_id: string | null
```

**Timestamps:**
```typescript
created_at: DateTime               // Not: created_at: string
updated_at: DateTime               // Not: updated_at: string
approved_at: DateTime | null       // Not: approved_at: string | null
```

**File metadata:**
```typescript
mime_type: MimeType | null         // Not: mime_type: string | null
```

**Error handling:**
```typescript
throw new InvalidInputError('email', emailString, Email.examples());
throw new NotFoundError(`Engagement ${id} not found`);
throw new ConflictError('Email already registered');
```

**Pagination responses:**
```typescript
interface BidsResponse extends PagedResults<Bid> {
  // Includes: count, pageCount, pageNumber, pageSize, hasPrevious, hasNext
}
```

### ❌ DO NOT USE for:

**Domain models:**
```typescript
// WRONG - zerobias-org/types won't have this
import { WorkRequest } from '@zerobias-org/types-core-js';  // ❌
import { Bid } from '@zerobias-org/types-core-js';  // ❌

// RIGHT - keep in SME Mart
import { WorkRequest } from './models/work-request.model'; // ✅
import { Bid } from './models/bid.model'; // ✅
```

**Business enums:**
```typescript
// WRONG
import { BudgetType } from '@zerobias-org/types-core-js';  // ❌
import { BidStatus } from '@zerobias-org/types-core-js';  // ❌

// RIGHT
import { BudgetType } from './models/enums'; // ✅
import { BidStatus } from './models/enums'; // ✅
```

**Financial amounts:**
```typescript
// WRONG - Decimal not available
price: Decimal // ❌

// RIGHT - use string + service validation
price: string | null // ✅
```

---

## Installation & Usage

```bash
npm install @zerobias-org/types-core-js
```

### Import UUID

```typescript
import { UUID } from '@zerobias-org/types-core-js';

// Create
const id = new UUID('550e8400-e29b-41d4-a716-446655440000');

// Parse with validation
const id = await UUID.parse(userInput);  // Throws InvalidInputError if invalid

// Generate
const id = UUID.generateV4();

// Convert
const str = id.toString();  // Returns UUID string
```

### Import DateTime

```typescript
import { DateTime } from '@zerobias-org/types-core-js';

// Parse ISO 8601
const dt = new DateTime('2025-03-05T13:45:30Z');

// Convert
const isoString = dt.toISOString();
```

### Import Error Classes

```typescript
import {
  InvalidInputError,
  NotFoundError,
  ConflictError,
  UnexpectedError
} from '@zerobias-org/types-core-js';

// Use with helpful context
throw new InvalidInputError('email', 'not-an-email@', Email.examples());

// Serialize for API responses
const errorResponse = {
  success: false,
  error: error.toJSON(),
  data: null
};
```

### Import PagedResults

```typescript
import { PagedResults } from '@zerobias-org/types-core-js';

// Wrap response
const response: PagedResults<Proposal> = {
  elements: [...proposals],
  count: 42,
  pageCount: 5,
  pageNumber: 1,
  pageSize: 10,
  hasPrevious: false,
  hasNext: true
};
```

---

## Available Type Classes

### String Formats (with validation)

| Type | Validation | Examples |
|------|-----------|----------|
| `UUID` | UUID format (v1-v5) | `550e8400-e29b-41d4-a716-446655440000` |
| `Email` | Email address | `user@example.com` |
| `DateTime` | ISO 8601 | `2025-03-05T13:45:30Z` |
| `Duration` | ISO 8601 duration | `P3D`, `PT2H30M`, `P1Y2M3DT4H5M6S` |
| `URL` | Valid URL | `https://example.com/path` |
| `Hostname` | Domain/hostname | `example.com` |
| `IpAddress` | IPv4/IPv6 | `192.168.1.1`, `::1` |
| `MacAddress` | MAC address | `00:1a:2b:3c:4d:5e` |
| `Cidr` | CIDR notation | `192.168.0.0/16` |
| `Netmask` | Network mask | `255.255.255.0` |
| `MimeType` | MIME type | `application/json`, `text/plain` |
| `PhoneNumber` | Phone format | `+1-555-123-4567` |
| `Semver` | Semantic version | `1.2.3`, `2.0.0-beta` |
| `Nmtoken` | XML name token | `my-name_123` |

### Numeric Types

| Type | Range |
|------|-------|
| `Integer` | Arbitrary precision |
| `Int32` | -2^31 to 2^31-1 |
| `Int64` | -2^63 to 2^63-1 |
| `Byte` | 0-255 |
| `Float` | Single precision |
| `Double` | Double precision |

**Note:** `Decimal` is NOT available (as of March 2025). Use strings for financial amounts.

---

## Error Classes

### HTTP Status Mapping

| Error | HTTP Status | Use When |
|-------|---|---|
| `InvalidInputError` | 400 | Input fails validation |
| `UnauthorizedError` | 401 | User not authenticated |
| `ForbiddenError` | 403 | User lacks permission |
| `NotFoundError` | 404 | Resource doesn't exist |
| `ConflictError` | 409 | Resource already exists |
| `RateLimitExceededError` | 429 | Too many requests |
| `UnexpectedError` | 500 | Internal server error |
| `TimeoutError` | 504 | Request timeout |

### Usage Pattern

```typescript
try {
  const id = await UUID.parse(userInput);
  // ...
} catch (error) {
  if (error instanceof InvalidInputError) {
    return {
      success: false,
      error: error.toJSON(),
      data: null
    };
  }
  throw error;  // Re-throw unexpected errors
}
```

---

## Migration Checklist

When updating SME Mart models:

- [ ] Install: `npm install @zerobias-org/types-core-js`
- [ ] Update `id` fields: `string` → `UUID`
- [ ] Update `zerobias_user_id` fields: `string` → `UUID`
- [ ] Update `zerobias_org_id` fields: `string` → `UUID`
- [ ] Update `zerobias_*_id` fields: `string` → `UUID`
- [ ] Update timestamp fields: `string` → `DateTime`
- [ ] Update `mime_type` fields: `string` → `MimeType`
- [ ] Create mapper functions (string ↔ UUID/DateTime)
- [ ] Update error handling (use InvalidInputError, etc.)
- [ ] Consider PagedResults for paginated responses

---

## File Paths (Reference)

| What | Where |
|------|-------|
| **Detailed comparison** | `.claude/notes/zerobias-org-types-comparison.md` |
| **This quick ref** | `.claude/notes/types-quick-reference.md` |
| **types repo** | `https://github.com/zerobias-org/types` |
| **Package source** | `packages/core-js/src/` in types repo |
| **Error classes** | `packages/core-js/src/errors/` in types repo |
| **Type classes** | `packages/core-js/src/types/` in types repo |

---

## Questions?

See "Part 9: Questions for Kevin" in the detailed comparison for:
- Decimal type availability
- Timeline field handling (Duration vs string)
- Version compatibility
