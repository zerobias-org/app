# zerobias-org/types vs SME Mart Models: Comparison Analysis

## Executive Summary

`zerobias-org/types` provides a rich collection of **validated type classes** (UUID, Email, Duration, DateTime, Error classes, pagination utilities) that SME Mart is NOT currently using. SME Mart uses plain `string` and `number` types for UUIDs, dates, and primitives, which misses opportunities for type safety and validation.

**Key findings:**
- SME Mart uses plain strings for all IDs, timestamps, and primitives (no type validation)
- `zerobias-org/types` provides validated wrappers (UUID, DateTime, Email, Duration)
- SME Mart could benefit from PagedResults and error handling patterns
- SME Mart should NOT use types-core for domain models — it's for primitives/utilities only
- No model duplication exists (core-types is not domain-specific)

---

## Part 1: What zerobias-org/types Provides

### **Core Exports (ESM, Node.js 22+)**

```typescript
// Package: @zerobias-org/types-core-js
export { UUID, getNilUUID }               // Validated UUID class with generation
export { Email }                           // Email string validation
export { DateTime }                        // ISO 8601 datetime parsing
export { Duration }                        // ISO 8601 duration (P3D, PT2H30M, etc.)
export { URL }                             // URL validation
export { Hostname, IpAddress, Cidr, Netmask, MacAddress } // Network types
export { PhoneNumber }                     // Phone validation
export { Password }                        // Password constraints
export { Nmtoken }                         // XML-style names
export { Semver, VersionRange }            // Version parsing
export { MimeType, DateFormat, NumberFormat } // Format types
export { Int32, Int64, Integer, Byte, Float, Double } // Numeric types

// Error classes
export { InvalidInputError, NoSuchObjectError, UnauthorizedError }
export { NotFoundError, ConflictError, RateLimitExceededError }
export { TimeoutError, UnexpectedError, CoreError } // + 11 more

// Pagination and utilities
export { PagedResults, PaginationMode }  // Paged result wrapper
export { PropertySelector, EnumValue }    // Utilities

// Event/change tracking
export { Event, ChangeEvent, CronEvent }  // Platform event models
export { Cron, DayOfWeek, Month }         // Cron expression support

// Platform types (HubConnectionProfile, OAuth, TLS, etc.)
export { Tag, BasicConnection, CloudProvider, TimeZone, Language }
```

### **Validation Pattern Example**

```typescript
// Type-safe with validation
const userId = await UUID.parse(userIdString);  // Throws InvalidInputError if invalid
console.log(userId.toString());  // Safe: returns valid UUID

// vs SME Mart's current approach
const userId: string = userIdString;  // No validation
// Could contain anything, caller doesn't know it's a UUID
```

---

## Part 2: SME Mart's Current Model Architecture

### **Entity Models (Database-derived)**

| Model | Purpose | Key Fields |
|-------|---------|-----------|
| `WorkRequest` | Engagement/project | id, title, budget_type, status, zerobias_task_id |
| `Proposal` | Bid on engagement | id, request_id, provider_id, status, proposed_price |
| `Review` | Rating/feedback | id, provider_id, rating, approved, approved_by |
| `ServiceOffering` | Provider's service | id, title, pricing_type, price, is_active |
| `EngagementDocument` | File upload | id, zb_file_id, document_type, mime_type |
| `MarketplaceUser` | User record | id, zerobias_user_id, display_name, email |

### **Abstraction Models (Resource framework)**

| Model | Purpose | Usage |
|-------|---------|-------|
| `SmeMartResource` | Unified tagging/linking interface | Maps any entity to ZB Resource model |
| `SmeMartResourceTag` | Tag assignment | Tracks tags on resources |
| `SmeMartResourceLink` | Entity relationships | Mirrors ZB link types |

### **Enums (Application-level constraints)**

```typescript
export type BudgetType = 'fixed' | 'hourly' | 'negotiable';
export type RequestStatus = 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled';
export type ProposalStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';
export type PricingType = 'fixed' | 'hourly' | 'subscription' | 'custom';
export type DocumentType = 'security_requirements' | 'sow' | 'budget' | 'legal_terms' | 'compliance' | 'functional_spec' | 'other';
```

### **Current Type Strategy**

- **All IDs:** Plain `string` (no UUID wrapper)
- **All timestamps:** Plain `string` in ISO format
- **Prices:** Plain `string` (could be decimal)
- **No error types:** SME Mart services throw generic errors
- **No validation:** Validation happens at API boundaries, not in models
- **No pagination wrapper:** Services return raw arrays

---

## Part 3: Gap Analysis

### **A. Primitive Types (Should Use zerobias-org/types)**

| SME Mart Current | zerobias-org/types | Benefit | Impact |
|---|---|---|---|
| `id: string` | `id: UUID` | Type-safe, validates format | **HIGH** — All entity IDs |
| `created_at: string` | `created: DateTime` | Parse & validate ISO 8601 | **MEDIUM** — Date logic |
| `email: string \| null` | `email: Email` | Validates email format | **LOW** — Not critical |
| `proposed_price: string \| null` | `price: Decimal` (not available) | Prevent $ rounding errors | **HIGH** — But type-core lacks Decimal |
| No error classes | `InvalidInputError`, etc. | Consistent error format | **MEDIUM** — API responses |
| Paged arrays | `PagedResults<T>` | Standardized pagination | **LOW** — Currently manual |

### **B. What SME Mart Should NOT Use**

**zerobias-org/types is NOT a domain model library:**

- ❌ Do NOT use for WorkRequest, Proposal, Review (these are SME Mart-specific)
- ❌ Do NOT use for ServiceOffering, EngagementDocument (domain concepts)
- ✅ DO use for primitives: UUID, Email, Duration, etc.
- ✅ DO use for error classes
- ✅ DO use for PagedResults wrapper

**Example:** `WorkRequest` is business logic specific to SME Mart. It will never be in zerobias-org/types because it's not a cross-platform primitive.

---

## Part 4: Detailed Comparison by Model

### **WorkRequest** (Neon table: `work_requests`)

```typescript
// Current SME Mart
export interface WorkRequest {
  id: string;                           // Plain string
  buyer_zerobias_user_id: string;       // Plain string (should be UUID)
  budget_min: string | null;            // Plain string (should be Decimal)
  created_at: string;                   // Plain string ISO (could be DateTime)
  status: RequestStatus;                // ✅ Good — typed enum
}

// With zerobias-org/types
export interface WorkRequest {
  id: UUID;                             // Validated
  buyer_zerobias_user_id: UUID;         // Validated
  budget_min: Decimal | null;           // Not available in core-js!
  created_at: DateTime;                 // Parsed and validated
  status: RequestStatus;                // ✅ Keep as-is
}

// Issue: zerobias-org/types has NO Decimal type
// Solution: Keep budget fields as strings, add validation in service layer
```

### **Proposal** (Neon table: `proposals`)

```typescript
// Current
export interface Proposal {
  id: string;
  request_id: string | null;
  provider_id: string | null;
  proposed_price: string | null;
  created_at: string;
  status: ProposalStatus;               // ✅ Good enum
}

// Recommendation
export interface Proposal {
  id: UUID;                             // Use UUID class
  request_id: UUID | null;              // Use UUID class
  provider_id: UUID | null;             // Use UUID class
  proposed_price: string | null;        // Keep string (no Decimal in core-js)
  created_at: DateTime;                 // Parse as DateTime
  status: ProposalStatus;               // ✅ Keep
}
```

### **Review** (Neon table: `reviews`)

```typescript
// Current
export interface Review {
  id: string;
  provider_id: string | null;
  reviewer_zerobias_user_id: string;
  rating: number;                       // ✅ Good — primitive number
  approved_by: string | null;
  created_at: string;
}

// Recommendation
export interface Review {
  id: UUID;
  provider_id: UUID | null;
  reviewer_zerobias_user_id: UUID;
  rating: number;                       // ✅ Keep
  approved_by: UUID | null;
  created_at: DateTime;
}
```

### **ServiceOffering** (Neon table: `service_offerings`)

```typescript
// Current
export interface ServiceOffering {
  id: string;
  provider_id: string | null;
  price: string | null;                 // No decimal support
  created_at: string;
  pricing_type: PricingType;            // ✅ Good enum
}

// Recommendation: Minimal changes
export interface ServiceOffering {
  id: UUID;
  provider_id: UUID | null;
  price: string | null;                 // Keep (zerobias-org/types has no Decimal)
  created_at: DateTime;
  pricing_type: PricingType;            // ✅ Keep
}
```

### **EngagementDocument** (Neon table: `engagement_documents`)

```typescript
// Current
export interface EngagementDocument {
  id: string;
  engagement_id: string;
  zb_file_id: string;
  zb_file_version_id: string;
  filename: string;
  mime_type?: string | null;            // Could use MimeType
  uploaded_by_zerobias_user_id: string;
  created_at: string;
}

// Recommendation
export interface EngagementDocument {
  id: UUID;
  engagement_id: UUID;
  zb_file_id: UUID;
  zb_file_version_id: UUID;
  filename: string;
  mime_type?: MimeType | null;          // Use zerobias-org/types MimeType
  uploaded_by_zerobias_user_id: UUID;
  created_at: DateTime;
}
```

### **SmeMartResource** (Abstraction layer)

```typescript
// Current
export interface SmeMartResource {
  id: string;
  name: string;
  type: SmeMartResourceType;
  ownerId: string;                      // zerobias_user_id
  created: string;                      // ISO timestamp
  updated: string;                      // ISO timestamp
  parentId?: string | null;
}

// Recommendation
export interface SmeMartResource {
  id: UUID;
  name: string;
  type: SmeMartResourceType;
  ownerId: UUID;
  created: DateTime;                    // Parse timestamps
  updated: DateTime;
  parentId?: UUID | null;
}

// Note: SmeMartResourceType and RESOURCE_TYPE_LABELS are SME Mart-specific
// These should NOT be moved to zerobias-org/types
```

### **Enums** (Application-level, NOT in zerobias-org/types)

```typescript
// ✅ KEEP THESE IN SME MART
export type BudgetType = 'fixed' | 'hourly' | 'negotiable';
export type RequestStatus = 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled';
export type ProposalStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';
export type PricingType = 'fixed' | 'hourly' | 'subscription' | 'custom';
export type DocumentType = 'security_requirements' | 'sow' | 'budget' | /* etc */;

// These are business domain enums, not primitives.
// zerobias-org/types contains only cross-platform primitives and error codes.
```

---

## Part 5: Migration Path (Prioritized)

### **Phase 1: Low-risk, High-value (Week 1)**

1. **Import UUID from zerobias-org/types**
   - Update models to use `id: UUID` instead of `id: string`
   - Create mapper functions: `toUUID(str): UUID`, `fromUUID(uuid): string`
   - Update services to convert at API boundaries

2. **Import DateTime for timestamps**
   - Change `created_at: string` → `created_at: DateTime`
   - Update mappers to parse ISO strings on read, serialize on write

3. **Import Error classes**
   - Replace generic `throw new Error(...)` with `InvalidInputError`, `NotFoundError`
   - Update error handling in service layer

### **Phase 2: Medium-value (Week 2+)**

4. **Import PagedResults wrapper**
   - Wrap paginated responses: `PagedResults<WorkRequest>` instead of raw arrays
   - Add metadata (page, pageSize, total count)

5. **Import MimeType for documents**
   - Validate mime types on EngagementDocument

### **Phase 3: Blocked (Needs zerobias-org/types enhancement)**

6. **Decimal type (NOT available in core-js)**
   - `price`, `budget_min`, `budget_max` need proper decimal handling
   - Workaround: Keep as strings, validate in service layer with regex or `decimal.js`
   - **Action:** Raise issue with Kevin to add Decimal to zerobias-org/types

---

## Part 6: Dependency Analysis

### **Current SME Mart Dependencies**

```json
"@zerobias-com/zerobias-angular-client": "^1.1.22",
"@zerobias-org/data-utils": "^1.0.22",
"@zerobias-org/ngx-library": "^0.2.15"
```

### **Required Additions**

```json
// Add:
"@zerobias-org/types-core-js": "^<latest>"
```

**Check latest version:**
```bash
npm view @zerobias-org/types-core-js version
```

### **Compatibility Notes**

- `@zerobias-org/types-core-js` requires Node.js 22+ (ESM only)
- SME Mart is Angular 21 (ESM-compatible)
- No breaking changes expected

---

## Part 7: Implementation Recommendations

### **Do's**

✅ **Use zerobias-org/types for:**
- `UUID` class for all ID fields
- `DateTime` for timestamps (created_at, updated_at, approved_at)
- `Email` for email validation (if adding user profile fields)
- `Duration` for timeline/delivery_time fields (ISO 8601)
- Error classes (InvalidInputError, NotFoundError, ConflictError)
- `PagedResults<T>` for paginated API responses
- `MimeType` for document mime types

### **Don'ts**

❌ **Do NOT use zerobias-org/types for:**
- Domain models (WorkRequest, Proposal, Review, ServiceOffering)
- Business enums (BudgetType, RequestStatus, PricingType, DocumentType)
- SmeMartResource, SmeMartResourceTag, SmeMartResourceLink (SME Mart-specific)
- Decimal types (not available — use strings with service-layer validation)

### **File Organization**

```typescript
// models/index.ts
export * from './enums';              // ✅ Keep SME Mart enums
export * from './work-request.model';
export * from './proposal.model';
// ... etc

// models/shared.ts (NEW FILE)
// Re-export zerobias-org/types for convenience
export { UUID, DateTime, Duration, Email, MimeType } from '@zerobias-org/types-core-js';
export {
  InvalidInputError,
  NotFoundError,
  ConflictError,
  UnexpectedError
} from '@zerobias-org/types-core-js';
export { PagedResults, PaginationMode } from '@zerobias-org/types-core-js';
```

### **Example: Updated WorkRequest Model**

```typescript
import { UUID, DateTime } from '@zerobias-org/types-core-js';
import { BudgetType, RequestStatus } from './enums';

export interface WorkRequest {
  id: UUID;                                    // ✨ Changed
  buyer_user_id: string | null;               // Keep (local SME Mart ID)
  buyer_zerobias_user_id: UUID;               // ✨ Changed
  buyer_zerobias_org_id: UUID | null;         // ✨ Changed
  title: string;
  description: string | null;
  category: string;
  budget_type: BudgetType | null;             // ✅ Keep enum
  budget_min: string | null;                  // Keep (no Decimal type)
  budget_max: string | null;                  // Keep (no Decimal type)
  timeline: string | null;                    // Could use Duration?
  status: RequestStatus;                      // ✅ Keep enum
  engagement_tag: string | null;
  zerobias_tag_id: UUID | null;               // ✨ Changed
  zerobias_boundary_id: UUID | null;          // ✨ Changed
  zerobias_task_id: UUID | null;              // ✨ Changed
  created_at: DateTime;                       // ✨ Changed
  updated_at: DateTime;                       // ✨ Changed
}
```

### **Mapper Pattern**

```typescript
// models/mappers/work-request.mapper.ts
import { UUID, DateTime } from '@zerobias-org/types-core-js';
import { WorkRequest as WorkRequestRow } from './work-request.model';

export interface WorkRequestRow {
  id: UUID;
  buyer_zerobias_user_id: UUID;
  created_at: DateTime;
  // ... etc
}

export function fromDatabaseRow(row: any): WorkRequest {
  return {
    id: new UUID(row.id),
    buyer_zerobias_user_id: new UUID(row.buyer_zerobias_user_id),
    created_at: new DateTime(row.created_at),
    // ... etc
  };
}

export function toDatabaseRow(model: WorkRequest): Record<string, any> {
  return {
    id: model.id.toString(),
    buyer_zerobias_user_id: model.buyer_zerobias_user_id.toString(),
    created_at: model.created_at.toISOString(),
    // ... etc
  };
}
```

---

## Part 8: Summary Table

| Feature | zerobias-org/types | SME Mart Use? | Notes |
|---------|---|---|---|
| **UUID class** | ✅ Yes | ✅ Use for all IDs | Validates format, generation methods |
| **DateTime class** | ✅ Yes | ✅ Use for timestamps | ISO 8601 parsing |
| **Duration class** | ✅ Yes | ⚠️ Consider | For timeline/delivery_time fields |
| **Email class** | ✅ Yes | ⚠️ Maybe | If validating user emails |
| **MimeType class** | ✅ Yes | ✅ Use for documents | Validates MIME types |
| **Decimal class** | ❌ No | ❌ Not available | Use strings + service validation |
| **Error classes** | ✅ 21 types | ✅ Use | InvalidInputError, NotFoundError, etc. |
| **PagedResults<T>** | ✅ Yes | ✅ Consider | For paginated responses |
| **Enums** | ❌ No | ✅ Keep local | Domain-specific (BudgetType, etc.) |
| **Domain models** | ❌ No | ✅ Keep local | WorkRequest, Proposal, etc. |

---

## Part 9: Questions for Kevin

1. **Decimal type:** When will `@zerobias-org/types-core-js` add a Decimal/Money type for financial fields?
   - Workaround: Keep price/budget fields as strings, validate with `decimal.js` library
   - Blocker: If Kevin prioritizes this, delay Phase 1 until Decimal is available

2. **Timeline fields:** Should we use `Duration` class for timeline/delivery_time?
   - Current: `timeline: string | null` (free text: "2 weeks", "ASAP")
   - Proposal: `timeline: Duration | null` (ISO 8601: "P2W")
   - Trade-off: Loses user-friendly text, gains validation

3. **Version compatibility:** What's the minimum version of `@zerobias-org/types-core-js` that SME Mart should target?

---

## Conclusion

**zerobias-org/types provides excellent foundation types (UUID, DateTime, error classes) that SME Mart should adopt for type safety and validation. However, it is NOT a domain model repository — all SME Mart business entities (WorkRequest, Proposal, Review) should remain in SME Mart's codebase.**

**Recommended action:**
1. Install `@zerobias-org/types-core-js`
2. Update models to use UUID, DateTime, MimeType for primitives
3. Create mappers to convert between database rows and typed models
4. Update service error handling to use zerobias-org error classes
5. Keep all business enums and domain models in SME Mart
