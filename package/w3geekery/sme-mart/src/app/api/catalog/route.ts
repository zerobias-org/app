/**
 * ZeroBias Catalog API Proxy
 *
 * Proxies requests to ZeroBias catalog endpoints using the SDK:
 * - roles: NICE Work Roles
 * - skills: NICE Skills/Qualifications
 * - frameworks: Compliance Frameworks
 * - segments: Industry Segments
 * - products: Product Catalog
 * - serviceSegments: Service category tags
 * - vendors: Product vendors
 *
 * Usage: GET /api/catalog?type=roles&search=security
 */

import { NextRequest, NextResponse } from 'next/server';
import { platform, portal } from '@zerobias-com/zerobias-sdk';
import { getConnectedSdk } from '@/lib/zerobias-sdk';

interface CatalogItem {
  id: string;
  name: string;
  code?: string;
  description?: string;
  categoryName?: string;
  vendorName?: string;
  [key: string]: unknown;
}

// Normalize SDK response to consistent format
function normalizeItems<T extends { id?: unknown; name?: string; code?: string; description?: string }>(
  items: T[]
): CatalogItem[] {
  return items.map(item => ({
    id: String(item.id || ''),
    name: item.name || '',
    code: item.code,
    description: item.description,
    ...item,
  }));
}

// Client-side search filter (SDK doesn't always support server-side search)
function filterBySearch(items: CatalogItem[], search: string): CatalogItem[] {
  if (!search) return items;

  const searchLower = search.toLowerCase();
  return items.filter(item =>
    item.name?.toLowerCase().includes(searchLower) ||
    item.code?.toLowerCase().includes(searchLower) ||
    item.description?.toLowerCase().includes(searchLower)
  );
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const type = searchParams.get('type');
  const search = searchParams.get('search') || '';
  const pageSize = parseInt(searchParams.get('pageSize') || '100', 10);

  if (!type) {
    return NextResponse.json({ error: 'Missing type parameter' }, { status: 400 });
  }

  try {
    const sdk = await getConnectedSdk();
    let items: CatalogItem[] = [];

    switch (type) {
      case 'roles': {
        // NICE Work Roles
        const result = await sdk.platform.getCatalogRoleApi().list(1, pageSize);
        // Include category name + code for grouping (e.g., "Cyberspace Effects (CE)")
        items = (result.items || []).map(item => {
          const role = item as {
            id?: unknown;
            name?: string;
            description?: string;
            roleCategory?: {
              id?: string;
              name?: string;
              externalCode?: string;
            };
          };
          const catName = role.roleCategory?.name;
          const catCode = role.roleCategory?.externalCode;
          return {
            id: String(role.id || ''),
            name: role.name || '',
            description: role.description,
            categoryId: role.roleCategory?.id,
            categoryName: catName && catCode ? `${catName} (${catCode})` : catName,
          };
        });
        // Sort by category name (case-insensitive), then by role name
        items.sort((a, b) => {
          const catA = (a.categoryName || '').toLowerCase();
          const catB = (b.categoryName || '').toLowerCase();
          if (catA !== catB) return catA.localeCompare(catB);
          return (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase());
        });
        break;
      }

      case 'roleCategories': {
        // NICE Role Categories
        const result = await sdk.platform.getCatalogRoleApi().listRoleCategories(1, pageSize);
        items = normalizeItems(result.items || []);
        break;
      }

      case 'skills': {
        // NICE Skills (roleQualifications with type=skill)
        const skillType = 'skill' as unknown as platform.QualificationTypeDef;
        const result = await sdk.platform.getCatalogRoleApi().listRoleQualifications(1, pageSize, skillType);
        // Use description (trimmed) as name, keep code for badge
        items = (result.items || []).map(item => {
          const skill = item as { id?: unknown; name?: string; description?: string };
          // Trim "Skill in " prefix from description
          let displayName = skill.description || skill.name || '';
          if (displayName.toLowerCase().startsWith('skill in ')) {
            displayName = displayName.slice(9); // Remove "Skill in "
          }
          // Capitalize first letter
          displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
          return {
            id: String(skill.id || ''),
            name: displayName,
            code: skill.name, // The code like "s0011"
            description: skill.description,
          };
        });
        // Sort alphabetically by name (case-insensitive)
        items.sort((a, b) => (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase()));
        break;
      }

      case 'knowledge': {
        // NICE Knowledge (roleQualifications with type=knowledge)
        const knowledgeType = 'knowledge' as unknown as platform.QualificationTypeDef;
        const result = await sdk.platform.getCatalogRoleApi().listRoleQualifications(1, pageSize, knowledgeType);
        items = normalizeItems(result.items || []);
        break;
      }

      case 'frameworks': {
        // Compliance Frameworks - use portal frameworkSearch (same as platform UI)
        const searchBody: portal.SearchFrameworkBody = {};
        const result = await sdk.portal.getFrameworkApi().search(searchBody, 1, pageSize);
        // Don't include code for frameworks (name and code are nearly identical)
        items = (result.items || []).map(item => {
          const framework = item as {
            id?: unknown;
            name?: string;
            description?: string;
          };
          return {
            id: String(framework.id || ''),
            name: framework.name || '',
            description: framework.description,
            // No code - don't show badge for frameworks
          };
        });
        break;
      }

      case 'segments': {
        // Industry Segments
        const result = await sdk.platform.getSegmentApi().list(1, pageSize);
        items = normalizeItems(result.items || []);
        break;
      }

      case 'serviceSegments': {
        // Service Segments (professional service categories for SME Mart)
        // Uses tags with tagTypes=service-segment
        const tagTypes = ['service-segment'] as unknown as import('@zerobias-org/types-core-js').Nmtoken[];
        const result = await sdk.platform.getTagApi().listTags(1, pageSize, tagTypes);
        items = normalizeItems(result.items || []);
        break;
      }

      case 'products': {
        // Products (via portal productSearch)
        const searchBody: portal.SearchProductBody = {
          productServiceFilter: 'product' as unknown as portal.ProductServiceFilterDef,
        };
        const result = await sdk.portal.getProductApi().search(searchBody, 1, pageSize);
        // Don't include code for products, group by vendor name
        items = (result.items || []).map(item => {
          const product = item as {
            id?: unknown;
            name?: string;
            description?: string;
            vendorName?: string;
          };
          return {
            id: String(product.id || ''),
            name: product.name || '',
            description: product.description,
            vendorName: product.vendorName,
            // No code - don't show badge for products
          };
        });
        // Sort by vendor name (case-insensitive), then by product name
        items.sort((a, b) => {
          const vendorA = (a.vendorName || '').toLowerCase();
          const vendorB = (b.vendorName || '').toLowerCase();
          if (vendorA !== vendorB) return vendorA.localeCompare(vendorB);
          return (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase());
        });
        break;
      }

      case 'vendors': {
        // Vendors
        const result = await sdk.platform.getVendorApi().listVendors(1, pageSize);
        items = normalizeItems(result.items || []);
        break;
      }

      default:
        await sdk.disconnect();
        return NextResponse.json({ error: `Unknown catalog type: ${type}` }, { status: 400 });
    }

    // Disconnect SDK after use
    await sdk.disconnect();

    // Apply client-side search filter
    items = filterBySearch(items, search);

    return NextResponse.json({
      items,
      totalItems: items.length,
      type,
    });

  } catch (error) {
    console.error(`Catalog API error (${type}):`, error);
    return NextResponse.json(
      { error: 'Failed to fetch catalog data' },
      { status: 500 }
    );
  }
}
