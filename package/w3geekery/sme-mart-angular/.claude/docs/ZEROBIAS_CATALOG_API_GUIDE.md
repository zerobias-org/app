# ZeroBias Catalog API Guide

This guide documents the ZeroBias platform catalog APIs for use with the `@zerobias-com/zerobias-sdk`. These APIs provide source-of-truth data for compliance, security, and product management.

## Table of Contents

1. [Overview](#overview)
2. [NIST NICE Work Roles](#1-nist-nice-work-roles)
3. [Products](#2-products-api)
4. [Vendors](#3-vendors-api)
5. [Suites](#4-suites-api)
6. [Frameworks](#5-frameworks-api)
7. [Segments (Marketplace)](#6-segments-marketplace-api)
8. [Compliance Features](#7-compliance-features-api)
9. [Common Patterns](#8-common-patterns)
10. [Query Parameters Reference](#9-query-parameters-reference)

---

## Overview

The ZeroBias catalog provides authoritative data for:

| Domain | Description |
|--------|-------------|
| **Products** | Software products with vendors, versions, editions, components |
| **Vendors** | Software companies/organizations |
| **Suites** | Product families/lines (e.g., "Microsoft 365") |
| **Frameworks** | Compliance/regulatory frameworks (NIST, ISO, SOC2, etc.) |
| **Segments** | Marketplace categories/industries |
| **Compliance Features** | Security capabilities that link products to framework controls |
| **Roles** | NIST NICE work roles with skills, knowledge, and tasks |

### Base URL
All endpoints are prefixed with `/platform/catalog/`

### Authentication
All endpoints require authentication via JWT token.

### Pagination
Most list endpoints support pagination with `pageNumber` (1-indexed) and `pageSize` parameters.

---

## 1. NIST NICE Work Roles

NICE Work Roles are cybersecurity workforce roles organized into categories with associated skills, knowledge, and tasks.

### Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /platform/catalog/roleCategories` | List role categories |
| `GET /platform/catalog/roles` | List roles (filterable by category) |
| `GET /platform/catalog/roles/{id}` | Get single role with details |
| `GET /platform/catalog/roleQualifications` | List skills & knowledge |
| `GET /platform/catalog/roleJobDuties` | List job duties/tasks |

### SDK Usage

#### Get Role Categories
```typescript
import { CatalogRoleApi } from '@zerobias-com/zerobias-sdk';

// List all role categories
const categories = await catalogRoleApi.listCatalogRoleCategories();

// With search
const categories = await catalogRoleApi.listCatalogRoleCategories({
  search: 'provision',
  pageNumber: 1,
  pageSize: 50
});
```

#### Get Roles
```typescript
// List all roles
const roles = await catalogRoleApi.listCatalogRoles();

// Filter by category
const roles = await catalogRoleApi.listCatalogRoles({
  roleCategoryId: 'category-uuid-here'
});

// With search
const roles = await catalogRoleApi.listCatalogRoles({
  search: 'security architect',
  pageNumber: 1,
  pageSize: 50
});

// Get single role with full details
const role = await catalogRoleApi.getCatalogRole(roleId);
```

#### Get Qualifications (Skills & Knowledge)
```typescript
// Get ALL qualifications (skills + knowledge)
const allQualifications = await catalogRoleApi.listCatalogRoleQualifications();

// Get SKILLS only
const skills = await catalogRoleApi.listCatalogRoleQualifications({
  qualificationType: 'skill'
});

// Get KNOWLEDGE only
const knowledge = await catalogRoleApi.listCatalogRoleQualifications({
  qualificationType: 'knowledge'
});

// With search
const skills = await catalogRoleApi.listCatalogRoleQualifications({
  qualificationType: 'skill',
  search: 'vulnerability',
  pageNumber: 1,
  pageSize: 100
});
```

#### Get Job Duties (Tasks)
```typescript
// List all job duties
const duties = await catalogRoleApi.listCatalogRoleJobDuties();

// With search
const duties = await catalogRoleApi.listCatalogRoleJobDuties({
  search: 'assess',
  pageNumber: 1,
  pageSize: 100
});
```

### Response Shapes

#### RoleCategory
```typescript
interface RoleCategory {
  id: string;           // UUID
  ownerId: string;      // UUID
  name: string;         // "Securely Provision"
  code: string;         // "sp"
  externalCode: string; // External reference
  description?: string;
  packageCode?: string; // "nist.nice.role" for NICE categories
}
```

#### CatalogRole
```typescript
interface CatalogRole {
  id: string;
  ownerId: string;
  name: string;            // "Security Architect"
  description?: string;
  code: string;            // "sp_arc"
  packageCode?: string;    // "nist.nice.role"
  scalable: boolean;
  roleType: string;
  roleCategoryId?: string; // Links to RoleCategory
}

// Extended version (from getCatalogRole)
interface CatalogRoleExtended extends CatalogRole {
  roleCategory?: RoleCategory;    // Full category object
  qualifications: string[];       // Array of Qualification IDs
  jobDuties: string[];           // Array of JobDuty IDs
  orgTypes: string[];
}
```

#### Qualification
```typescript
interface Qualification {
  id: string;
  name: string;              // "Skill in conducting vulnerability scans..."
  description?: string;
  code: string;              // "S0001" for skills, "K0001" for knowledge
  qualificationType: 'knowledge' | 'skill';
  packageCode?: string;      // "nist.nice.role"
}
```

#### JobDuty
```typescript
interface JobDuty {
  id: string;
  name: string;           // Task description
  description?: string;
  code: string;           // "T0001"
  packageCode?: string;   // "nist.nice.role"
}
```

### NICE Framework Code Patterns

| Type | Code Pattern | Example |
|------|--------------|---------|
| Skills | S#### | S0001, S0002 |
| Knowledge | K#### | K0001, K0002 |
| Tasks | T#### | T0001, T0002 |
| Work Roles | XX_YYY | SP_ARC (Security Architect) |
| Categories | XX | SP (Securely Provision) |

### Example: Get Role with All Details

```typescript
async function getRoleWithFullDetails(roleId: string) {
  // 1. Get the role (includes qualification & jobDuty IDs)
  const role = await catalogRoleApi.getCatalogRole(roleId);

  // 2. Get all skills for lookup
  const allSkills = await catalogRoleApi.listCatalogRoleQualifications({
    qualificationType: 'skill',
    pageSize: 500
  });

  // 3. Get all knowledge for lookup
  const allKnowledge = await catalogRoleApi.listCatalogRoleQualifications({
    qualificationType: 'knowledge',
    pageSize: 500
  });

  // 4. Get all job duties for lookup
  const allDuties = await catalogRoleApi.listCatalogRoleJobDuties({
    pageSize: 500
  });

  // 5. Map IDs to full objects
  const qualificationsMap = new Map([...allSkills, ...allKnowledge].map(q => [q.id, q]));
  const dutiesMap = new Map(allDuties.map(d => [d.id, d]));

  return {
    ...role,
    skills: role.qualifications
      .map(id => qualificationsMap.get(id))
      .filter(q => q?.qualificationType === 'skill'),
    knowledge: role.qualifications
      .map(id => qualificationsMap.get(id))
      .filter(q => q?.qualificationType === 'knowledge'),
    tasks: role.jobDuties.map(id => dutiesMap.get(id))
  };
}
```

---

## 2. Products API

Products represent software applications with versions, editions, and components.

### Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /platform/catalog/products` | List all products |
| `GET /platform/catalog/products/{productId}` | Get product details |
| `GET /platform/catalog/products/{productId}/versions` | List product versions |
| `GET /platform/catalog/cpes/{cpe}` | Get product by CPE string |

### SDK Usage

```typescript
import { ProductApi } from '@zerobias-com/zerobias-sdk';

// List all products
const products = await productApi.listProducts();

// Filter by vendor
const products = await productApi.listProducts({
  vendorId: 'vendor-uuid',
  status: 'published',
  search: 'azure',
  pageNumber: 1,
  pageSize: 50
});

// Get single product with full details
const product = await productApi.getProduct(productId);

// Get product versions
const versions = await productApi.listProductVersions(productId);

// Lookup by CPE string
const product = await productApi.getByCpe('microsoft:azure');
```

### Response Shapes

#### Product
```typescript
interface Product {
  id: string;                    // UUID
  ownerId: string;              // UUID
  name: string;                 // "Microsoft Azure"
  description?: string;
  code: string;                 // "azure"
  type: string;                 // Resource type
  status: 'draft' | 'published' | 'deprecated';
  packageCode?: string;
  latestVersionId: string;      // UUID
  latestVersion: ProductVersion;
  artifactId?: string;
}
```

#### ProductExtended
```typescript
interface ProductExtended extends Product {
  // Version info
  versionId: string;
  semver: string;               // "1.0.0"

  // Vendor info
  vendorId?: string;
  vendorName?: string;          // "Microsoft"
  vendorCode?: string;          // "microsoft"
  vendor?: { id, name, code, description, imageUrl };

  // Suite info (product family)
  suiteId?: string;
  suiteName?: string;
  suiteCode?: string;
  suite?: { id, name, code, description, imageUrl };

  // Relationships
  segmentIds: string[];         // Marketplace segment UUIDs
  complianceFeatureIds: string[];
  productComponentIds: string[];
  productEditionIds: string[];

  // Classification
  factoryTypes: ('iaas' | 'paas' | 'saas')[];
  hostingTypes: ('cloud' | 'on_premise' | 'hybrid')[];

  // Nested objects
  productComponents: ProductComponentStub[];
  productEditions: ProductEditionStub[];
  cpeProducts?: CpeProduct;     // CPE identifiers
}
```

### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `vendorId` | UUID | Filter by vendor |
| `suiteId` | UUID | Filter by product suite |
| `status` | enum | `draft`, `published`, `deprecated` |
| `search` | string | Text search on name/code |
| `pageNumber` | number | Page number (1-indexed) |
| `pageSize` | number | Results per page |

---

## 3. Vendors API

Vendors represent software companies/organizations that produce products.

### Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /platform/catalog/vendors` | List all vendors |
| `GET /platform/catalog/suggestedVendors` | List suggested vendors |
| `POST /platform/catalog/suggestedVendors` | Submit a vendor suggestion |

### SDK Usage

```typescript
import { VendorApi } from '@zerobias-com/zerobias-sdk';

// List all vendors
const vendors = await vendorApi.listVendors();

// With search
const vendors = await vendorApi.listVendors({
  search: 'microsoft',
  pageNumber: 1,
  pageSize: 50
});

// List suggested vendors (community submissions)
const suggested = await vendorApi.listSuggestedVendors({
  keywords: 'cloud'
});

// Submit a vendor suggestion
const newSuggestion = await vendorApi.createSuggestedVendor({
  name: 'Acme Corp',
  description: 'Cloud security provider',
  url: 'https://acme.com'
});
```

### Response Shape

```typescript
interface Vendor {
  // From Resource base
  id: string;              // UUID
  ownerId: string;         // UUID
  name: string;            // "Microsoft"
  description?: string;
  type: string;

  // From CatalogItem
  code: string;            // "microsoft"
  status: 'draft' | 'published' | 'deprecated';
  packageCode?: string;
  logo?: string;           // URL to vendor logo
  url?: string;            // Vendor website
  logoFileVersionId?: string;

  // Vendor specific
  orgId?: string;          // Associated org if registered
  cpeVendors: string[];    // CPE vendor codes ["microsoft", "ms"]
  artifactVersionId?: string;
}
```

---

## 4. Suites API

Suites represent product families/lines from a vendor (e.g., "Microsoft 365", "AWS").

### Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /platform/catalog/suites` | List all suites |

### SDK Usage

```typescript
import { SuiteApi } from '@zerobias-com/zerobias-sdk';

// List all suites
const suites = await suiteApi.listSuites();

// Filter by vendor
const suites = await suiteApi.listSuites({
  vendorId: 'vendor-uuid',
  search: 'office',
  pageNumber: 1,
  pageSize: 50
});
```

### Response Shape

```typescript
interface Suite {
  // From Resource base
  id: string;
  ownerId: string;
  name: string;            // "Microsoft 365"
  description?: string;
  type: string;

  // From CatalogItem
  code: string;            // "microsoft-365"
  status: 'draft' | 'published' | 'deprecated';
  packageCode?: string;
  logo?: string;
  url?: string;

  // Suite specific
  artifactVersionId?: string;
}

interface SuiteExtended extends Suite {
  vendor: {
    id: string;
    name: string;
    code: string;
    description?: string;
    imageUrl?: string;
  };
}
```

---

## 5. Frameworks API

Frameworks represent compliance/regulatory frameworks with hierarchical elements.

### Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /platform/catalog/frameworks` | List all frameworks |
| `GET /platform/catalog/frameworks/{frameworkId}` | Get framework details |
| `GET /platform/catalog/frameworks/{frameworkId}/versions` | List framework versions |
| `GET /platform/catalog/frameworks/{frameworkId}/versions/{versionId}` | Get version details |
| `GET /platform/catalog/frameworks/{frameworkId}/versions/{versionId}/elements` | List elements |
| `GET /platform/catalog/frameworkElements/{id}` | Get element by ID |
| `GET /platform/catalog/browserFrameworks/{code}/{version}/{elementCode}` | Browse by code |
| `GET /platform/catalog/scfControls` | List SCF controls |
| `GET /platform/catalog/scfDomains` | List SCF domains |
| `GET /platform/catalog/scfSearches` | Search SCF |

### SDK Usage

```typescript
import { FrameworkApi } from '@zerobias-com/zerobias-sdk';

// List all frameworks
const frameworks = await frameworkApi.listFrameworks();

// Get specific framework
const framework = await frameworkApi.getFramework(frameworkId);

// Get framework versions
const versions = await frameworkApi.listFrameworkVersions(frameworkId);

// Get version with extended info
const version = await frameworkApi.getFrameworkVersion(frameworkId, versionId);

// List elements (controls, requirements, etc.)
const elements = await frameworkApi.listFrameworkElements(frameworkId, versionId, {
  type: 'control',           // Filter by element type
  keywords: 'encryption',    // Search keywords
  pageNumber: 1,
  pageSize: 100
});

// Browse by code (e.g., "nist-csf/1.1/PR.AC-1")
const element = await frameworkApi.getFrameworkElementByCode(
  'nist-csf',    // framework code
  '1.1',         // version code
  'PR.AC-1'      // element code
);

// SCF (Secure Controls Framework) specific
const scfControls = await frameworkApi.listScfControls();
const scfDomains = await frameworkApi.listScfDomains();
const searchResults = await frameworkApi.scfSearch({
  search: 'access control',
  scfType: 'control'  // 'domain', 'control', 'assertion'
});
```

### Response Shapes

#### Framework
```typescript
interface Framework {
  id: string;
  ownerId: string;
  name: string;                 // "NIST Cybersecurity Framework"
  description?: string;
  code: string;                 // "nist-csf"
  type: string;
  standardId: string;           // Links to standard
  status: 'draft' | 'published' | 'deprecated';
  internal: boolean;
  packageCode?: string;
  hasElements: boolean;
  elementCount: number;
}
```

#### FrameworkVersion
```typescript
interface FrameworkVersion {
  id: string;
  frameworkId: string;
  name: string;                 // "Version 1.1"
  code: string;                 // "1.1"
  semver: string;
  status: string;
}
```

#### FrameworkElement
```typescript
interface FrameworkElement {
  id: string;
  frameworkVersionId: string;
  name: string;                 // "Identity Management and Access Control"
  description?: string;
  code: string;                 // "PR.AC"
  elementType: string;          // "category", "subcategory", "control"
  parentId?: string;            // Parent element for hierarchy
  rank: number;                 // Sort order
  level: number;                // Depth in hierarchy
}
```

### Common Frameworks

| Code | Name |
|------|------|
| `nist-csf` | NIST Cybersecurity Framework |
| `nist-800-53` | NIST 800-53 |
| `iso-27001` | ISO 27001 |
| `soc2` | SOC 2 |
| `pci-dss` | PCI DSS |
| `hipaa` | HIPAA |
| `gdpr` | GDPR |
| `scf` | Secure Controls Framework |

---

## 6. Segments (Marketplace) API

Segments represent marketplace categories/industries used to classify products.

### Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /platform/catalog/segmentTypes` | List segment types |
| `GET /platform/catalog/segments` | List all segments |
| `GET /platform/catalog/segments/{segmentId}` | Get segment details |
| `GET /platform/catalog/segments/{segmentId}/versions` | List segment versions |

### SDK Usage

```typescript
import { SegmentApi } from '@zerobias-com/zerobias-sdk';

// List segment types (e.g., "industry", "category")
const segmentTypes = await segmentApi.listSegmentTypes();

// List all segments
const segments = await segmentApi.listSegments();

// Get segment details
const segment = await segmentApi.getSegment(segmentId);

// List versions
const versions = await segmentApi.listSegmentVersions(segmentId);
```

### Response Shapes

#### SegmentType
```typescript
interface SegmentType {
  id: string;
  name: string;          // "Industry", "Category"
  description?: string;
  code: string;          // "industry", "category"
  isService: boolean;
  rank: number;
}
```

#### Segment
```typescript
interface Segment {
  id: string;
  ownerId: string;
  name: string;          // "Healthcare", "Financial Services"
  description?: string;
  code: string;          // "healthcare", "financial_services"
  type: string;
  status: 'draft' | 'published' | 'deprecated';
  packageCode?: string;
  latestVersionId: string;
  latestVersion: SegmentVersion;
}

interface SegmentExtended extends Segment {
  parentSegmentIds: string[];    // Parent segments (hierarchy)
  complianceFeatureIds: string[]; // Associated compliance features
  productIds: string[];          // Products in this segment
}
```

---

## 7. Compliance Features API

Compliance Features represent security/compliance capabilities that products can support. They link products to framework controls.

### Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /platform/catalog/complianceFeatureTypes` | List feature type categories |
| `GET /platform/catalog/complianceFeatures` | List all compliance features |
| `GET /platform/catalog/complianceFeatures/{id}` | Get feature with full details |
| `GET /platform/catalog/complianceFeatures/{id}/versions` | List feature versions |

### SDK Usage

```typescript
import { ComplianceFeatureApi } from '@zerobias-com/zerobias-sdk';

// List feature types
const featureTypes = await complianceFeatureApi.listComplianceFeatureTypes();

// List all compliance features
const features = await complianceFeatureApi.listComplianceFeatures({
  pageNumber: 1,
  pageSize: 100
});

// Get feature with full details
const feature = await complianceFeatureApi.getComplianceFeature(featureId);

// Get feature versions
const versions = await complianceFeatureApi.listComplianceFeatureVersions(featureId);
```

### Response Shapes

#### ComplianceFeature
```typescript
interface ComplianceFeature {
  id: string;
  ownerId: string;
  name: string;            // "Multi-Factor Authentication"
  description?: string;
  type: string;
  status: 'draft' | 'published' | 'deprecated';
  packageCode?: string;
  artifactId?: string;
  publishedArtifactName?: string;
  latestVersionId: string;
  latestReleasedVersionId?: string;
  latestVersion: ComplianceFeatureVersion;
}
```

#### ComplianceFeatureExtended
```typescript
interface ComplianceFeatureExtended extends ComplianceFeature {
  // Version info
  latestVersionStatus: string;
  versionId: string;
  versionSemver: string;      // "1.0.0"
  versionValue: number;
  versionFloatValue: string;
  code: string;               // "mfa"
  externalId: string;

  // Feature classification
  complianceFeatureTypes: string[];  // ["authentication", "access_control"]

  // What supports this feature
  classOfferings: ComplianceFeatureSupportStub[];        // Asset classes
  productOfferings: ComplianceFeatureSupportStub[];      // Products
  segmentOfferings: ComplianceFeatureSupportStub[];      // Segments
  productEditionOfferings: ComplianceFeatureSupportStub[]; // Product editions

  // Framework mappings
  elements: ComplianceFeatureElement[];  // Links to framework elements
  standards: StandardStub[];             // Associated standards

  // Role & implementation
  roles: { id, name, description }[];    // Related roles
  implementations: Implementation[];      // Implementation guidance
}

interface ComplianceFeatureSupportStub {
  id: string;
  name: string;
  code?: string;
  supportStatus: 'supported' | 'partial' | 'not_supported' | 'unknown';
}

interface ComplianceFeatureElement {
  id: string;
  frameworkElementId: string;
  frameworkElementCode: string;
  frameworkElementName: string;
  frameworkId: string;
  frameworkCode: string;
  frameworkName: string;
}
```

---

## 8. Common Patterns

### Hierarchy Relationships

```
Vendor (Microsoft)
  └── Suite (Microsoft 365)
        └── Product (Microsoft Teams)
              ├── ProductVersion (1.0, 2.0)
              ├── ProductEdition (Basic, Premium)
              │     └── ProductEditionVersion
              ├── ProductComponent (Chat, Video)
              │     └── ProductComponentVersion
              ├── Segments (Collaboration, Communication)
              └── ComplianceFeatures (MFA, Encryption)
                    └── Framework Elements (NIST PR.AC-1)
```

### Common Lookup Patterns

```typescript
// Get all products for a vendor
const products = await productApi.listProducts({ vendorId: vendorId });

// Get all suites for a vendor
const suites = await suiteApi.listSuites({ vendorId: vendorId });

// Get products in a suite
const products = await productApi.listProducts({ suiteId: suiteId });

// Get products in a segment
const products = await productApi.listProducts();
const segmentProducts = products.filter(p =>
  p.segmentIds?.includes(segmentId)
);

// Get framework controls for a compliance feature
const feature = await complianceFeatureApi.getComplianceFeature(featureId);
const controls = feature.elements.map(e => ({
  framework: e.frameworkCode,
  control: e.frameworkElementCode,
  name: e.frameworkElementName
}));

// Filter NICE data by packageCode
const allCategories = await catalogRoleApi.listCatalogRoleCategories();
const niceCategories = allCategories.filter(c => c.packageCode === 'nist.nice.role');
```

### Complete Example: Product Compliance Report

```typescript
async function getProductComplianceReport(productId: string) {
  // 1. Get product with all details
  const product = await productApi.getProduct(productId);

  // 2. Get vendor info
  const vendors = await vendorApi.listVendors({ search: product.vendorCode });
  const vendor = vendors[0];

  // 3. Get compliance features for this product
  const allFeatures = await complianceFeatureApi.listComplianceFeatures({ pageSize: 500 });

  // 4. Filter to features that include this product
  const productFeatures = [];
  for (const feature of allFeatures) {
    const extended = await complianceFeatureApi.getComplianceFeature(feature.id);
    const supports = extended.productOfferings.find(p => p.id === productId);
    if (supports) {
      productFeatures.push({
        feature: extended.name,
        code: extended.code,
        supportStatus: supports.supportStatus,
        frameworkMappings: extended.elements.map(e => ({
          framework: e.frameworkName,
          control: e.frameworkElementCode
        }))
      });
    }
  }

  return {
    product: {
      id: product.id,
      name: product.name,
      version: product.semver,
      vendor: vendor?.name
    },
    complianceFeatures: productFeatures,
    segments: product.segmentIds,
    hostingTypes: product.hostingTypes,
    factoryTypes: product.factoryTypes
  };
}
```

### Example: Build a Product Catalog View

```typescript
async function buildProductCatalog() {
  // 1. Get all marketplace segments
  const segments = await segmentApi.listSegments({ pageSize: 500 });

  // 2. Get all products
  const products = await productApi.listProducts({
    status: 'published',
    pageSize: 500
  });

  // 3. Organize products by segment
  const productsBySegment = new Map<string, ProductExtended[]>();

  for (const product of products) {
    for (const segmentId of product.segmentIds || []) {
      if (!productsBySegment.has(segmentId)) {
        productsBySegment.set(segmentId, []);
      }
      productsBySegment.get(segmentId)!.push(product);
    }
  }

  // 4. Build catalog structure
  return segments.map(segment => ({
    segment: {
      id: segment.id,
      name: segment.name,
      code: segment.code
    },
    products: (productsBySegment.get(segment.id) || []).map(p => ({
      id: p.id,
      name: p.name,
      vendor: p.vendorName,
      version: p.semver
    }))
  }));
}
```

---

## 9. Query Parameters Reference

| API | Parameters |
|-----|------------|
| **Vendors** | `search`, `pageNumber`, `pageSize` |
| **Suites** | `vendorId`, `search`, `pageNumber`, `pageSize` |
| **Products** | `vendorId`, `suiteId`, `status`, `search`, `pageNumber`, `pageSize` |
| **Compliance Features** | `pageNumber`, `pageSize` |
| **Frameworks** | `pageNumber`, `pageSize` |
| **Framework Elements** | `type`, `keywords`, `sort`, `pageNumber`, `pageSize` |
| **Segments** | `pageNumber`, `pageSize` |
| **Roles** | `roleCategoryId`, `search`, `pageNumber`, `pageSize` |
| **Role Categories** | `search`, `pageNumber`, `pageSize` |
| **Role Qualifications** | `qualificationType` ('skill' \| 'knowledge'), `search`, `pageNumber`, `pageSize` |
| **Role Job Duties** | `search`, `pageNumber`, `pageSize` |
| **SCF Search** | `search`, `scfType` ('domain', 'control', 'assertion') |

### Status Values

All catalog resources use:
```typescript
type CatalogPublishStatus = 'draft' | 'published' | 'deprecated';
```

---

## Additional Resources

- [ZeroBias Platform Documentation](https://docs.zerobias.com)
- [NIST NICE Framework](https://niccs.cisa.gov/workforce-development/nice-framework)
- [Secure Controls Framework](https://securecontrolsframework.com)
