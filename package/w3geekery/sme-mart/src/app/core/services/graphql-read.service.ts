import { Injectable, inject } from '@angular/core';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import { ExecuteRawGraphqlQuery, SortObject } from '@zerobias-com/graphql-sdk';
import { UUID } from '@zerobias-org/types-core-js';

import type { SmeMartClassName } from './pipeline-write.service';

// ---------------------------------------------------------------------------
// Platform boundary ID (prod)
// ---------------------------------------------------------------------------
const BOUNDARY_ID = '2842fab1-ceff-4ec4-bf09-ce5e7c33c3e2';

/**
 * Page info returned alongside query results.
 */
export interface GqlPageInfo {
  pageNumber: number;
  pageSize: number;
  totalCount?: number;
}

/**
 * Wrapper for paginated GQL query results.
 */
export interface GqlQueryResult<T> {
  items: T[];
  page: GqlPageInfo;
}

/**
 * Options for GQL queries — filtering, pagination, sorting.
 */
export interface GqlQueryOptions {
  /** RFC4515-style filters: { status: '.eq.published', category: '.ilike.*SOC*' } */
  filters?: Record<string, string>;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string[];
  sortDir?: Array<'Asc' | 'Desc'>;
}

/**
 * Reads SME Mart entity data from AuditgraphDB via the platform GraphQL API.
 *
 * The GQL schema is auto-generated from the YAML class definitions.
 * All queries are boundary-scoped to the Platform boundary.
 *
 * NOTE: GQL types only appear after the dataloader has indexed objects
 * pushed through the pipeline. If a type isn't available yet, queries
 * will throw — callers should handle this gracefully.
 */
@Injectable({ providedIn: 'root' })
export class GraphqlReadService {
  private readonly clientApi = inject(ZerobiasClientApi);

  /**
   * Query entities of a given class with optional filtering, pagination, and sorting.
   *
   * @param className - The schema class name (e.g., 'Engagement')
   * @param fields - Array of field names to select (e.g., ['id', 'name', 'status'])
   * @param options - Filters, pagination, sorting
   * @returns Paginated query results
   *
   * @example
   * ```ts
   * const result = await gql.query<Engagement>('Engagement',
   *   ['id', 'name', 'status', 'category', 'budgetMin', 'budgetMax'],
   *   { filters: { status: '.eq.published' }, pageSize: 25 }
   * );
   * ```
   */
  async query<T>(
    className: SmeMartClassName,
    fields: string[],
    options: GqlQueryOptions = {},
  ): Promise<GqlQueryResult<T>> {
    const gqlQuery = this.buildQuery(className, fields, options);
    const boundaryApi = this.clientApi.graphqlClient.getBoundaryApi();
    const rawQuery = new ExecuteRawGraphqlQuery(gqlQuery);

    const result = await boundaryApi.boundaryExecuteRawQuery(
      new UUID(BOUNDARY_ID),
      rawQuery,
      false,                            // includeRawData
      options.pageNumber ?? 1,
      options.pageSize ?? 50,
      this.buildSort(options),
    );

    const data = result.data as Record<string, unknown> | null;
    const items = (data?.[className] as T[]) ?? [];
    const totalCount = result.gqlCount?.[className];

    return {
      items,
      page: {
        pageNumber: options.pageNumber ?? 1,
        pageSize: options.pageSize ?? 50,
        totalCount,
      },
    };
  }

  /**
   * Query a single entity by its external ID.
   *
   * @example
   * ```ts
   * const engagement = await gql.getById<Engagement>('Engagement',
   *   'test-engagement-001',
   *   ['id', 'name', 'status', 'category']
   * );
   * ```
   */
  async getById<T>(
    className: SmeMartClassName,
    id: string,
    fields: string[],
  ): Promise<T | null> {
    const result = await this.query<T>(className, fields, {
      filters: { id: `.eq.${id}` },
      pageSize: 1,
    });
    return result.items[0] ?? null;
  }

  /**
   * Execute a raw GQL query string directly.
   * Use for complex queries with nested relationships.
   *
   * @example
   * ```ts
   * const result = await gql.rawQuery(`{
   *   Engagement(status: ".eq.published") {
   *     id name
   *     bids { id price status }
   *   }
   * }`);
   * ```
   */
  async rawQuery(
    query: string,
    pageNumber = 1,
    pageSize = 50,
  ): Promise<Record<string, unknown>> {
    const boundaryApi = this.clientApi.graphqlClient.getBoundaryApi();
    const rawQuery = new ExecuteRawGraphqlQuery(query);

    const result = await boundaryApi.boundaryExecuteRawQuery(
      new UUID(BOUNDARY_ID),
      rawQuery,
      false,
      pageNumber,
      pageSize,
    );

    return (result.data as Record<string, unknown>) ?? {};
  }

  /**
   * Build a GQL query string from class name, fields, and filter options.
   */
  private buildQuery(
    className: string,
    fields: string[],
    options: GqlQueryOptions,
  ): string {
    const args: string[] = [];

    if (options.filters) {
      for (const [field, value] of Object.entries(options.filters)) {
        args.push(`${field}: "${value}"`);
      }
    }

    if (options.pageSize) {
      args.push(`pageSize: ${options.pageSize}`);
    }
    if (options.pageNumber) {
      args.push(`pageNumber: ${options.pageNumber}`);
    }
    if (options.sortBy?.length) {
      args.push(`sortBy: [${options.sortBy.map(s => `"${s}"`).join(', ')}]`);
    }
    if (options.sortDir?.length) {
      args.push(`sortDir: [${options.sortDir.map(s => `"${s}"`).join(', ')}]`);
    }

    const argStr = args.length > 0 ? `(${args.join(', ')})` : '';
    const fieldStr = fields.join(' ');

    return `{ ${className}${argStr} { ${fieldStr} } }`;
  }

  /**
   * Build sort object for the SDK call.
   */
  private buildSort(options: GqlQueryOptions): SortObject | undefined {
    if (!options.sortBy?.length) return undefined;
    return new SortObject(options.sortBy[0], options.sortDir?.[0] ?? 'Asc');
  }
}
