import { Injectable, inject } from '@angular/core';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import { ExecuteRawGraphqlQuery, SortObject } from '@zerobias-com/graphql-sdk';
import { UUID } from '@zerobias-org/types-core-js';
import { environment } from '../../../environments/environment';

import type { SmeMartClassName } from './pipeline-write.service';

/**
 * Classes we READ but never WRITE, so they carry no entry in SME_MART_CLASS_IDS —
 * that map exists to supply pipeline write ids, and these live in other schema
 * packages.
 *
 * `QualificationResource` is the shared certification catalog in
 * `zerobias.schemas.qualifications`, owned by the Content Team. The claim junctions
 * that point at it (OrgCertification / UserCertification) ARE ours and are written.
 */
export type ExternalReadClassName = 'QualificationResource';

/** Any class the read path will accept. Writes stay narrowed to SmeMartClassName. */
export type ReadableClassName = SmeMartClassName | ExternalReadClassName;

// ---------------------------------------------------------------------------
// Boundary ID (from environment — per-environment, NOT deterministic)
// ---------------------------------------------------------------------------
const BOUNDARY_ID = environment.boundaryId;

/**
 * Fields that are links to other objects rather than scalars. Requesting one bare
 * is a 500 from the boundary GQL parser, so every entry here is expanded to the
 * subfield its consumers read. Add a field here the moment a query names it.
 */
const LINK_FIELD_EXPANSIONS: Record<string, string> = {
  tag: 'tag { value }',
};

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
    className: ReadableClassName,
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
    className: ReadableClassName,
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

    // Only filters go inside the GQL query string.
    // pageSize, pageNumber, sort are HTTP query params handled by the SDK call.
    if (options.filters) {
      for (const [field, value] of Object.entries(options.filters)) {
        args.push(`${field}: "${value}"`);
      }
    }

    // Link fields resolve to OBJECTS, not scalars, and the boundary GQL parser
    // rejects them bare ("must have a selection of subfields"). Any caller naming
    // one gets it expanded to the single subfield consumers actually read.
    //   tag -> the `value` uuid (see pipeline-write:220, which merges `tag` onto
    //          write payloads, so narrowing is not a removal)
    const expandedFields = fields.map(f => LINK_FIELD_EXPANSIONS[f] ?? f);

    const argStr = args.length > 0 ? `(${args.join(', ')})` : '';
    const fieldStr = expandedFields.join(' ');

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
