/**
 * Explore ZeroBias Catalog APIs
 *
 * Run with: npx tsx scripts/explore-catalog.ts
 *
 * Requires env vars:
 *   NEXT_PUBLIC_API_HOSTNAME - ZeroBias API host
 *   NEXT_PUBLIC_API_KEY - API key for auth
 *   NEXT_PUBLIC_DEFAULT_ORG_ID - Org ID
 */

import axios from 'axios';

const API_HOST = process.env.NEXT_PUBLIC_API_HOSTNAME || process.env.NEXT_PUBLIC_ZEROBIAS_HOST;
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
const ORG_ID = process.env.NEXT_PUBLIC_DEFAULT_ORG_ID;

if (!API_HOST || !API_KEY || !ORG_ID) {
  console.error('Missing required env vars');
  process.exit(1);
}

const api = axios.create({
  baseURL: API_HOST.includes('/api') ? API_HOST : `${API_HOST}/api`,
  headers: {
    'Authorization': `APIKey ${API_KEY}`,
    'Content-Type': 'application/json',
    'Dana-Org-Id': ORG_ID,
  },
});

interface PagedResults<T> {
  items: T[];
  totalItems: number;
  pageNumber: number;
  pageSize: number;
}

interface Product {
  id: string;
  name: string;
  code: string;
  description?: string;
  status: string;
  vendorName?: string;
  vendorCode?: string;
  suiteName?: string;
  semver?: string;
  factoryTypes?: string[];
  hostingTypes?: string[];
}

interface Framework {
  id: string;
  name: string;
  code: string;
  description?: string;
  status: string;
  hasElements: boolean;
  elementCount: number;
}

interface Segment {
  id: string;
  name: string;
  code: string;
  description?: string;
  status: string;
}

interface SegmentType {
  id: string;
  name: string;
  code: string;
  description?: string;
}

interface Vendor {
  id: string;
  name: string;
  code: string;
  description?: string;
  status: string;
}

async function explore() {
  console.log('Exploring ZeroBias Catalog APIs...\n');
  console.log(`API Host: ${API_HOST}\n`);

  // ========================================
  // 1. PRODUCTS
  // ========================================
  console.log('='.repeat(80));
  console.log('\n📦 PRODUCTS\n');

  try {
    const productsRes = await api.get<PagedResults<Product>>('/platform/catalog/products', {
      params: { pageSize: 100, status: 'published' }
    });

    const products = productsRes.data.items || productsRes.data;
    if (Array.isArray(products)) {
      console.log(`  Found ${products.length} published products:\n`);

      // Group by vendor
      const byVendor = new Map<string, Product[]>();
      for (const p of products) {
        const vendor = p.vendorName || 'Unknown Vendor';
        if (!byVendor.has(vendor)) byVendor.set(vendor, []);
        byVendor.get(vendor)!.push(p);
      }

      // Show top vendors with products
      const sortedVendors = [...byVendor.entries()].sort((a, b) => b[1].length - a[1].length);

      for (const [vendor, vendorProducts] of sortedVendors.slice(0, 10)) {
        console.log(`  📁 ${vendor} (${vendorProducts.length} products)`);
        for (const p of vendorProducts.slice(0, 5)) {
          const types = [
            ...(p.factoryTypes || []),
            ...(p.hostingTypes || [])
          ].join(', ');
          console.log(`      • ${p.name}${types ? ` [${types}]` : ''}`);
        }
        if (vendorProducts.length > 5) {
          console.log(`      ... and ${vendorProducts.length - 5} more`);
        }
        console.log('');
      }

      if (sortedVendors.length > 10) {
        console.log(`  ... and ${sortedVendors.length - 10} more vendors\n`);
      }

      console.log(`  Total: ${products.length} products from ${byVendor.size} vendors`);
    }
  } catch (err: any) {
    console.log(`  Error: ${err.response?.data?.message || err.message}`);
  }

  // ========================================
  // 2. VENDORS
  // ========================================
  console.log('\n' + '='.repeat(80));
  console.log('\n🏢 VENDORS\n');

  try {
    const vendorsRes = await api.get<PagedResults<Vendor>>('/platform/catalog/vendors', {
      params: { pageSize: 100 }
    });

    const vendors = vendorsRes.data.items || vendorsRes.data;
    if (Array.isArray(vendors)) {
      console.log(`  Found ${vendors.length} vendors:\n`);

      for (const v of vendors.slice(0, 20)) {
        console.log(`    • ${v.name} (${v.code})`);
      }

      if (vendors.length > 20) {
        console.log(`\n    ... and ${vendors.length - 20} more vendors`);
      }
    }
  } catch (err: any) {
    console.log(`  Error: ${err.response?.data?.message || err.message}`);
  }

  // ========================================
  // 3. FRAMEWORKS
  // ========================================
  console.log('\n' + '='.repeat(80));
  console.log('\n📋 FRAMEWORKS\n');

  try {
    const frameworksRes = await api.get<PagedResults<Framework>>('/platform/catalog/frameworks', {
      params: { pageSize: 100 }
    });

    const frameworks = frameworksRes.data.items || frameworksRes.data;
    if (Array.isArray(frameworks)) {
      console.log(`  Found ${frameworks.length} frameworks:\n`);

      // Sort by element count (most detailed first)
      const sorted = [...frameworks].sort((a, b) => (b.elementCount || 0) - (a.elementCount || 0));

      for (const f of sorted) {
        const elements = f.elementCount ? ` (${f.elementCount} elements)` : '';
        const status = f.status !== 'published' ? ` [${f.status}]` : '';
        console.log(`    [${f.code}] ${f.name}${elements}${status}`);
      }
    }
  } catch (err: any) {
    console.log(`  Error: ${err.response?.data?.message || err.message}`);
  }

  // ========================================
  // 4. SEGMENT TYPES
  // ========================================
  console.log('\n' + '='.repeat(80));
  console.log('\n🏷️  SEGMENT TYPES\n');

  try {
    const segmentTypesRes = await api.get<PagedResults<SegmentType>>('/platform/catalog/segmentTypes', {
      params: { pageSize: 100 }
    });

    const segmentTypes = segmentTypesRes.data.items || segmentTypesRes.data;
    if (Array.isArray(segmentTypes)) {
      console.log(`  Found ${segmentTypes.length} segment types:\n`);

      for (const st of segmentTypes) {
        console.log(`    [${st.code}] ${st.name}`);
        if (st.description) {
          console.log(`        ${st.description.substring(0, 80)}${st.description.length > 80 ? '...' : ''}`);
        }
      }
    }
  } catch (err: any) {
    console.log(`  Error: ${err.response?.data?.message || err.message}`);
  }

  // ========================================
  // 5. SEGMENTS
  // ========================================
  console.log('\n' + '='.repeat(80));
  console.log('\n🏪 SEGMENTS (Marketplace Categories)\n');

  try {
    const segmentsRes = await api.get<PagedResults<Segment>>('/platform/catalog/segments', {
      params: { pageSize: 200 }
    });

    const segments = segmentsRes.data.items || segmentsRes.data;
    if (Array.isArray(segments)) {
      console.log(`  Found ${segments.length} segments:\n`);

      for (const s of segments.slice(0, 30)) {
        const status = s.status !== 'published' ? ` [${s.status}]` : '';
        console.log(`    [${s.code}] ${s.name}${status}`);
      }

      if (segments.length > 30) {
        console.log(`\n    ... and ${segments.length - 30} more segments`);
      }
    }
  } catch (err: any) {
    console.log(`  Error: ${err.response?.data?.message || err.message}`);
  }

  // ========================================
  // 6. COMPLIANCE FEATURES (sample)
  // ========================================
  console.log('\n' + '='.repeat(80));
  console.log('\n🛡️  COMPLIANCE FEATURES (sample)\n');

  try {
    const featuresRes = await api.get<PagedResults<any>>('/platform/catalog/complianceFeatures', {
      params: { pageSize: 30 }
    });

    const features = featuresRes.data.items || featuresRes.data;
    if (Array.isArray(features)) {
      console.log(`  Found ${featuresRes.data.totalItems || features.length} compliance features (showing first 30):\n`);

      for (const f of features) {
        console.log(`    • ${f.name}`);
      }
    }
  } catch (err: any) {
    console.log(`  Error: ${err.response?.data?.message || err.message}`);
  }

  // ========================================
  // SUMMARY
  // ========================================
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 SUMMARY\n');
  console.log('  Available for SME Mart Profile Panels:\n');
  console.log('  ┌─────────────────────────┬──────────────────────────────────────────┐');
  console.log('  │ Panel                   │ ZeroBias Source                          │');
  console.log('  ├─────────────────────────┼──────────────────────────────────────────┤');
  console.log('  │ Roles                   │ /catalog/roles (NICE Work Roles)         │');
  console.log('  │ Skills                  │ /catalog/roleQualifications (S####)      │');
  console.log('  │ Product Experience      │ /catalog/products                        │');
  console.log('  │ Framework Experience    │ /catalog/frameworks                      │');
  console.log('  │ Segments                │ /catalog/segments                        │');
  console.log('  │ Compliance Features     │ /catalog/complianceFeatures              │');
  console.log('  └─────────────────────────┴──────────────────────────────────────────┘');
  console.log('');
}

explore().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
