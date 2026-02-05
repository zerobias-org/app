/**
 * ZeroBias Catalog API Proxy
 *
 * Proxies requests to ZeroBias catalog endpoints for:
 * - roles: NICE Work Roles (95)
 * - skills: NICE Skills/Qualifications (556)
 * - frameworks: Compliance Frameworks (12)
 * - segments: Industry Segments (128)
 * - products: Product Catalog (663)
 *
 * Usage: GET /api/catalog?type=roles&search=security
 */

import { NextRequest, NextResponse } from 'next/server';

const ZEROBIAS_HOST = process.env.NEXT_PUBLIC_ZEROBIAS_HOST || 'https://ci.zerobias.com';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
const ORG_ID = process.env.NEXT_PUBLIC_DEFAULT_ORG_ID;

interface CatalogItem {
  id: string;
  name: string;
  code?: string;
  description?: string;
  [key: string]: unknown;
}

interface PagedResponse {
  items?: CatalogItem[];
  totalItems?: number;
  pageNumber?: number;
  pageSize?: number;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const type = searchParams.get('type');
  const search = searchParams.get('search') || '';
  const pageSize = searchParams.get('pageSize') || '100';

  if (!type) {
    return NextResponse.json({ error: 'Missing type parameter' }, { status: 400 });
  }

  if (!API_KEY || !ORG_ID) {
    return NextResponse.json({ error: 'Missing API configuration' }, { status: 500 });
  }

  const headers: HeadersInit = {
    'Authorization': `APIKey ${API_KEY}`,
    'Content-Type': 'application/json',
    'Dana-Org-Id': ORG_ID,
  };

  try {
    let url: string;
    let method: 'GET' | 'POST' = 'GET';
    let body: string | undefined;

    switch (type) {
      case 'roles':
        // NICE Work Roles
        url = `${ZEROBIAS_HOST}/api/platform/catalog/roles?pageSize=${pageSize}`;
        break;

      case 'roleCategories':
        // NICE Role Categories
        url = `${ZEROBIAS_HOST}/api/platform/catalog/roleCategories?pageSize=${pageSize}`;
        break;

      case 'skills':
        // NICE Skills (roleQualifications with type=skill)
        url = `${ZEROBIAS_HOST}/api/platform/catalog/roleQualifications?qualificationType=skill&pageSize=${pageSize}`;
        break;

      case 'knowledge':
        // NICE Knowledge (roleQualifications with type=knowledge)
        url = `${ZEROBIAS_HOST}/api/platform/catalog/roleQualifications?qualificationType=knowledge&pageSize=${pageSize}`;
        break;

      case 'frameworks':
        // Compliance Frameworks
        url = `${ZEROBIAS_HOST}/api/platform/catalog/frameworks?pageSize=${pageSize}`;
        break;

      case 'segments':
        // Industry Segments (all segments - product categories, tools, etc.)
        url = `${ZEROBIAS_HOST}/api/platform/catalog/segments?pageSize=${pageSize}`;
        break;

      case 'serviceSegments':
        // Service Segments (professional service categories for SME Mart)
        //
        // TODO: Once ZeroBias service segments are populated, switch to the segment list
        // endpoint with isService filter. Check periodically if segments have been updated.
        // See master plan: .claude/plans/public/000-MASTER-PLAN.md
        //
        // FUTURE APPROACH (when service segments are populated):
        // url = `${ZEROBIAS_HOST}/api/platform/catalog/segments?pageSize=${pageSize}`;
        // Then filter response where latestVersion.isService === true
        //
        // CURRENT APPROACH: Use tags with tagTypes=service-segment
        url = `${ZEROBIAS_HOST}/api/platform/tags?tagTypes=service-segment&pageSize=${pageSize}`;
        break;

      case 'products':
        // Products (uses POST to productSearch)
        url = `${ZEROBIAS_HOST}/api/portal/productSearch?pageSize=${pageSize}`;
        method = 'POST';
        body = JSON.stringify({ productServiceFilter: 'product' });
        break;

      case 'vendors':
        // Vendors
        url = `${ZEROBIAS_HOST}/api/platform/catalog/vendors?pageSize=${pageSize}`;
        break;

      default:
        return NextResponse.json({ error: `Unknown catalog type: ${type}` }, { status: 400 });
    }

    const response = await fetch(url, {
      method,
      headers,
      body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`ZeroBias API error (${type}):`, response.status, errorText);
      return NextResponse.json(
        { error: `ZeroBias API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data: PagedResponse | CatalogItem[] = await response.json();

    // Normalize response (some endpoints return array, some return paged object)
    let items: CatalogItem[] = [];
    if (Array.isArray(data)) {
      items = data;
    } else if (data.items) {
      items = data.items;
    }

    // Client-side search filter (ZeroBias doesn't always support server-side search)
    if (search) {
      const searchLower = search.toLowerCase();
      items = items.filter(item =>
        item.name?.toLowerCase().includes(searchLower) ||
        item.code?.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower)
      );
    }

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
