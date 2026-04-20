import { APIRequestContext } from '@playwright/test';

/**
 * API helpers for SME Mart E2E tests.
 *
 * All requests go through the Angular dev server proxy at localhost:4200/api/*,
 * which injects the API key + dana-org-id cookie. Tests should use the
 * Playwright `request` fixture and call these helpers for cleanup or
 * pre-test setup via the REST / hydra APIs.
 *
 * For GQL queries or Pipeline writes (SME Mart entities live in AuditgraphDB),
 * reach into the dev server via /api/* — the proxy forwards to uat.zerobias.com.
 *
 * Note: Platform list endpoints return arrays directly, NOT { items: [] }.
 */

export interface ListParams {
  pageNumber?: number;
  pageSize?: number;
}

export class ApiHelper {
  constructor(
    private request: APIRequestContext,
    private baseUrl: string,
  ) {}

  /** GET /api/<path> — returns parsed JSON or null on failure */
  async get<T = unknown>(path: string): Promise<T | null> {
    const resp = await this.request.get(`${this.baseUrl}/api/${path.replace(/^\//, '')}`);
    if (!resp.ok()) return null;
    return (await resp.json()) as T;
  }

  /** DELETE /api/<path> — returns true on success */
  async delete(path: string): Promise<boolean> {
    const resp = await this.request.delete(`${this.baseUrl}/api/${path.replace(/^\//, '')}`);
    return resp.ok();
  }

  /** GET /api/<path>?pageNumber=1&pageSize=N — returns array (platform format) */
  async list<T = unknown>(path: string, params: ListParams = {}): Promise<T[]> {
    const pageNumber = params.pageNumber ?? 1;
    const pageSize = params.pageSize ?? 100;
    const separator = path.includes('?') ? '&' : '?';
    const url = `${this.baseUrl}/api/${path.replace(/^\//, '')}${separator}pageNumber=${pageNumber}&pageSize=${pageSize}`;
    const resp = await this.request.get(url);
    if (!resp.ok()) return [];
    const body = await resp.json();
    // Platform list endpoints return arrays directly
    if (Array.isArray(body)) return body as T[];
    // Some endpoints wrap in { results: [] } or { items: [] }
    if (body?.results && Array.isArray(body.results)) return body.results as T[];
    if (body?.items && Array.isArray(body.items)) return body.items as T[];
    return [];
  }
}
