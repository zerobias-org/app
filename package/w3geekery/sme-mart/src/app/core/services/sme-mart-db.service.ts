import { Injectable, inject, signal } from '@angular/core';
import { DataProducerClient } from '@zerobias-org/data-utils';
import type { ConnectionResult, QueryOptions } from '@zerobias-org/data-utils';
import type { CollectionsApi as HubCollectionsApi } from '@zerobias-org/hub-sdk-interface-dataproducer';
import { URL as ZbURL, PagedResults } from '@zerobias-org/types-core-js';
import { ZerobiasClientSessionId } from '@zerobias-com/zerobias-client';
import { neon } from '@neondatabase/serverless';
import { environment } from '../../../environments/environment';

/**
 * SmeMartDbService - PARTIAL DEPRECATION (Phase 5 Migration)
 *
 * MIGRATED TO PIPELINE (Phase 5):
 * - Engagement, Bid, BidResponse
 * - Note, NoteFolder
 * - SmeMartDocument
 * - ServiceOffering, Review
 *
 * These 8 entities now use PipelineWriteService (writes) + GraphqlReadService (reads).
 * Neon tables for these entities will be archived 2 weeks after Phase 5 completion.
 * Archival timeline: 2-week observation period for production stability verification.
 * Target archival date: 2026-04-02
 *
 * REMAINING IN NEON (still use SmeMartDbService):
 * - Categories, Notifications, Provider Profiles
 * - Impersonation context, Note hierarchy cache
 * - Admin settings, Resource management, Marketplace users
 *
 * Supports two modes via `environment.dbMode`:
 *   - 'hub'  — DataProducer via Generic SQL Hub Module (production)
 *   - 'neon' — Direct Neon HTTP queries via @neondatabase/serverless (dev fallback)
 *
 * The public API is identical in both modes. All domain services
 * (ProviderProfilesService, EngagementsService, etc.) are unaware of the mode.
 */
@Injectable({ providedIn: 'root' })
export class SmeMartDbService {
  private readonly sessionIdService = inject(ZerobiasClientSessionId);

  // Hub mode state
  private client: DataProducerClient | null = null;
  private objectIdCache = new Map<string, string>();

  // Neon mode state
  private sql: ReturnType<typeof neon> | null = null;

  /** Whether the DB connection is active */
  readonly connected = signal(false);

  /** Last connection error, if any */
  readonly connectionError = signal<string | null>(null);

  /** Current mode */
  readonly mode = signal<'hub' | 'neon'>(environment.dbMode);

  // ===========================================================================
  // Connection
  // ===========================================================================

  async connect(connectionId?: string): Promise<ConnectionResult> {
    if (environment.dbMode === 'neon') {
      return this.connectNeon();
    }
    return this.connectHub(connectionId);
  }

  private connectNeon(): ConnectionResult {
    const url = environment.neonConnectionString;
    if (!url) {
      const result: ConnectionResult = {
        success: false,
        error: 'No neonConnectionString configured. Add NEON_DATABASE_URL to .env.local and restart.',
      };
      this.connectionError.set(result.error!);
      return result;
    }

    try {
      this.sql = neon(url, { disableWarningInBrowsers: true });
      this.connected.set(true);
      this.connectionError.set(null);
      this.mode.set('neon');
      console.log('[SmeMartDb] Connected in Neon direct mode');
      return { success: true };
    } catch (err) {
      const result: ConnectionResult = {
        success: false,
        error: `Neon connection failed: ${(err as Error).message}`,
      };
      this.connectionError.set(result.error!);
      return result;
    }
  }

  private async connectHub(connectionId?: string): Promise<ConnectionResult> {
    const targetId = connectionId || environment.smeMartConnectionId;
    if (!targetId) {
      const result: ConnectionResult = {
        success: false,
        error: 'No smeMartConnectionId configured in environment',
      };
      this.connectionError.set(result.error!);
      return result;
    }

    this.client = new DataProducerClient();
    const server = new ZbURL(`${window.location.origin}/api/hub`);

    // Pass session id so the Hub proxy gets `Authorization: session <id>`
    // header in addition to the dana-session-id cookie. Mirrors the fix in
    // zb/ui PR #140 (commit 8c2297136 in @zerobias-com/zerobias-angular-client).
    // Without this, dana 401s the /api/hub/targets/<id>/metadata call when
    // the cookie is missing or scoped wrong.
    const session = this.sessionIdService.getCurrentSessionId() ?? undefined;
    const result = await this.client.connect({ server, targetId, session });

    this.connected.set(result.success);
    this.mode.set('hub');
    if (!result.success) {
      this.connectionError.set(result.error || 'Unknown connection error');
    } else {
      this.connectionError.set(null);
    }

    return result;
  }

  async disconnect(): Promise<void> {
    if (this.mode() === 'hub' && this.client) {
      await this.client.disconnect();
      this.client = null;
      this.objectIdCache.clear();
    }
    if (this.mode() === 'neon') {
      this.sql = null;
    }
    this.connected.set(false);
  }

  // ===========================================================================
  // Raw SQL (Neon mode only — for custom queries like JOINs)
  // ===========================================================================

  async neonQueryPublic<T = Record<string, unknown>>(query: string): Promise<T[]> {
    if (this.mode() !== 'neon') throw new Error('neonQueryPublic() is only available in Neon mode');
    return this.neonQuery<T>(query);
  }

  // ===========================================================================
  // Public CRUD API — same interface regardless of mode
  // ===========================================================================

  async listRows<T = Record<string, unknown>>(
    tableName: string,
    options?: QueryOptions,
  ): Promise<PagedResults<T>> {
    if (this.mode() === 'neon') return this.neonListRows<T>(tableName, options);
    const id = await this.resolveTableId(tableName);
    return this.getClient().collections.getCollectionElements(id, options) as Promise<PagedResults<T>>;
  }

  async searchRows<T = Record<string, unknown>>(
    tableName: string,
    filter: string,
    options?: QueryOptions,
  ): Promise<PagedResults<T>> {
    if (this.mode() === 'neon') return this.neonSearchRows<T>(tableName, filter, options);
    const id = await this.resolveTableId(tableName);
    return this.getClient().collections.searchCollectionElements(id, filter, options) as Promise<PagedResults<T>>;
  }

  async getRow<T = Record<string, unknown>>(
    tableName: string,
    rowId: string,
  ): Promise<T | null> {
    if (this.mode() === 'neon') return this.neonGetRow<T>(tableName, rowId);
    const result = await this.searchRows<T>(tableName, `(id=${rowId})`, {
      pageNumber: 1,
      pageSize: 1,
    });
    return result.items?.[0] ?? null;
  }

  async createRow<T = Record<string, unknown>>(
    tableName: string,
    data: Record<string, unknown>,
  ): Promise<T> {
    if (this.mode() === 'neon') return this.neonCreateRow<T>(tableName, data);
    const id = await this.resolveTableId(tableName);
    return this.getHubCollectionsApi().addCollectionElement(id, data as { [key: string]: object }) as Promise<T>;
  }

  async updateRow<T = Record<string, unknown>>(
    tableName: string,
    rowKey: string,
    data: Record<string, unknown>,
    pkColumn = 'id',
  ): Promise<T> {
    if (this.mode() === 'neon') return this.neonUpdateRow<T>(tableName, rowKey, data, pkColumn);
    const id = await this.resolveTableId(tableName);
    return this.getHubCollectionsApi().updateCollectionElement(id, rowKey, data as { [key: string]: object }) as Promise<T>;
  }

  async deleteRow(tableName: string, rowKey: string, pkColumn = 'id'): Promise<void> {
    if (this.mode() === 'neon') return this.neonDeleteRow(tableName, rowKey, pkColumn);
    const id = await this.resolveTableId(tableName);
    return this.getHubCollectionsApi().deleteCollectionElement(id, rowKey);
  }

  async getRowByKey<T = Record<string, unknown>>(
    tableName: string,
    rowKey: string,
  ): Promise<T> {
    if (this.mode() === 'neon') {
      const row = await this.neonGetRow<T>(tableName, rowKey);
      if (!row) throw new Error(`Row not found: ${tableName}/${rowKey}`);
      return row;
    }
    const id = await this.resolveTableId(tableName);
    return this.getHubCollectionsApi().getCollectionElement(id, rowKey) as Promise<T>;
  }

  // ===========================================================================
  // Hub mode — object tree navigation
  // ===========================================================================

  async getRoot() {
    return this.getClient().objects.getRoot();
  }

  async getChildren(objectId: string) {
    return this.getClient().objects.getChildren(objectId);
  }

  async resolveTableId(tableName: string): Promise<string> {
    const cached = this.objectIdCache.get(tableName);
    if (cached) return cached;

    const client = this.getClient();
    const root = await client.objects.getRoot();
    const databases = await client.objects.getChildren(root.id);
    const neondb = databases.find((db) => db.name === 'neondb');
    if (!neondb) {
      throw new Error(`Database 'neondb' not found. Available: ${databases.map((d) => d.name).join(', ')}`);
    }

    const schemas = await client.objects.getChildren(neondb.id);
    const publicSchema = schemas.find((s) => s.name === 'public');
    if (!publicSchema) {
      throw new Error(`Schema 'public' not found. Available: ${schemas.map((s) => s.name).join(', ')}`);
    }

    const tables = await client.objects.getChildren(publicSchema.id);
    const table = tables.find((t) => t.name === tableName);
    if (!table) {
      throw new Error(`Table '${tableName}' not found. Available: ${tables.map((t) => t.name).join(', ')}`);
    }

    this.objectIdCache.set(tableName, table.id);
    return table.id;
  }

  async getTableSchema(tableName: string) {
    const id = await this.resolveTableId(tableName);
    const obj = await this.getClient().objects.getObject(id);
    if (obj.schemaId) {
      return this.getClient().schemas.getSchema(obj.schemaId);
    }
    return null;
  }

  // ===========================================================================
  // Neon direct mode — SQL queries via HTTP
  // ===========================================================================

  private getSql(): ReturnType<typeof neon> {
    if (!this.sql) throw new Error('SmeMartDbService: Neon not connected. Call connect() first.');
    return this.sql;
  }

  /** Execute a raw SQL query string via sql.query() (not tagged template) */
  private async neonQuery<T = Record<string, unknown>>(query: string): Promise<T[]> {
    const sql = this.getSql();
    // neon v1.x requires sql.query() for conventional function calls
    // This is safe because we control all inputs via quoteIdent/escapeValue
    const raw = await (sql as unknown as {
      query: (q: string, params: unknown[], opts: { fullResults: boolean }) => Promise<unknown>;
    }).query(query, [], { fullResults: false });

    // Normalize response shape. Some neon-serverless versions/configurations return
    // the raw HTTP response wrapper {fields, rows, rowAsArray, ...} even with
    // fullResults: false; others return rows directly. Handle both. When rowAsArray
    // is true, rows come back as positional tuples — map them to keyed objects using
    // the fields metadata.
    if (Array.isArray(raw)) return raw as T[];
    if (raw && typeof raw === 'object' && 'rows' in raw) {
      const wrapper = raw as { rows: unknown[]; rowAsArray?: boolean; fields?: { name: string }[] };
      const rows = wrapper.rows ?? [];
      if (wrapper.rowAsArray && Array.isArray(wrapper.fields)) {
        const names = wrapper.fields.map(f => f.name);
        return rows.map((row) => {
          if (!Array.isArray(row)) return row as T;
          const obj: Record<string, unknown> = {};
          row.forEach((v, i) => { obj[names[i]] = v; });
          return obj as T;
        });
      }
      return rows as T[];
    }
    return [] as T[];
  }

  private async neonListRows<T>(tableName: string, options?: QueryOptions): Promise<PagedResults<T>> {
    const page = options?.pageNumber ?? 1;
    const size = options?.pageSize ?? 25;
    const offset = (page - 1) * size;

    const rows = await this.neonQuery<T>(
      `SELECT * FROM ${this.quoteIdent(tableName)} LIMIT ${size} OFFSET ${offset}`,
    );
    const countResult = await this.neonQuery<{ total: number }>(
      `SELECT count(*)::int AS total FROM ${this.quoteIdent(tableName)}`,
    );
    const total = countResult[0]?.total ?? rows.length;

    return PagedResults.fromArray(rows, page, size, total);
  }

  private async neonSearchRows<T>(tableName: string, filter: string, options?: QueryOptions): Promise<PagedResults<T>> {
    const page = options?.pageNumber ?? 1;
    const size = options?.pageSize ?? 25;
    const offset = (page - 1) * size;
    const where = this.rfc4515ToSql(filter);

    const rows = await this.neonQuery<T>(
      `SELECT * FROM ${this.quoteIdent(tableName)} WHERE ${where} LIMIT ${size} OFFSET ${offset}`,
    );
    const countResult = await this.neonQuery<{ total: number }>(
      `SELECT count(*)::int AS total FROM ${this.quoteIdent(tableName)} WHERE ${where}`,
    );
    const total = countResult[0]?.total ?? rows.length;

    return PagedResults.fromArray(rows, page, size, total);
  }

  private async neonGetRow<T>(tableName: string, rowId: string): Promise<T | null> {
    const rows = await this.neonQuery<T>(
      `SELECT * FROM ${this.quoteIdent(tableName)} WHERE id = '${this.escapeValue(rowId)}' LIMIT 1`,
    );
    return rows[0] ?? null;
  }

  private async neonCreateRow<T>(tableName: string, data: Record<string, unknown>): Promise<T> {
    const entries = Object.entries(data).filter(([, v]) => v !== undefined);
    const cols = entries.map(([k]) => this.quoteIdent(k)).join(', ');
    const vals = entries.map(([, v]) => this.sqlValue(v)).join(', ');

    const rows = await this.neonQuery<T>(
      `INSERT INTO ${this.quoteIdent(tableName)} (${cols}) VALUES (${vals}) RETURNING *`,
    );
    return rows[0];
  }

  private async neonUpdateRow<T>(tableName: string, rowKey: string, data: Record<string, unknown>, pkColumn = 'id'): Promise<T> {
    const entries = Object.entries(data).filter(([, v]) => v !== undefined);
    const setClauses = entries.map(([k, v]) => `${this.quoteIdent(k)} = ${this.sqlValue(v)}`).join(', ');

    const rows = await this.neonQuery<T>(
      `UPDATE ${this.quoteIdent(tableName)} SET ${setClauses} WHERE ${this.quoteIdent(pkColumn)} = '${this.escapeValue(rowKey)}' RETURNING *`,
    );
    return rows[0];
  }

  private async neonDeleteRow(tableName: string, rowKey: string, pkColumn = 'id'): Promise<void> {
    await this.neonQuery(
      `DELETE FROM ${this.quoteIdent(tableName)} WHERE ${this.quoteIdent(pkColumn)} = '${this.escapeValue(rowKey)}'`,
    );
  }

  // ===========================================================================
  // SQL helpers (Neon mode)
  // ===========================================================================

  /**
   * Convert a simple RFC4515 filter to SQL WHERE clause.
   * Handles: (key=value), (&(a=b)(c=d)), (|(a=b)(c=d)), (key=*partial*)
   */
  private rfc4515ToSql(filter: string): string {
    let f = filter.trim();

    // AND: (&(a=b)(c=d))
    if (f.startsWith('(&')) {
      const inner = f.slice(2, -1);
      const parts = this.splitFilterParts(inner);
      return parts.map((p) => this.rfc4515ToSql(p)).join(' AND ');
    }

    // OR: (|(a=b)(c=d))
    if (f.startsWith('(|')) {
      const inner = f.slice(2, -1);
      const parts = this.splitFilterParts(inner);
      return '(' + parts.map((p) => this.rfc4515ToSql(p)).join(' OR ') + ')';
    }

    // Simple: (key=value)
    if (f.startsWith('(') && f.endsWith(')')) {
      f = f.slice(1, -1);
    }

    const eqIdx = f.indexOf('=');
    if (eqIdx === -1) return 'TRUE';

    const key = f.slice(0, eqIdx);
    const value = f.slice(eqIdx + 1);

    // Wildcard: *partial*
    if (value.includes('*')) {
      const like = value.replace(/\*/g, '%');
      return `${this.quoteIdent(key)} ILIKE '${this.escapeValue(like)}'`;
    }

    // Boolean
    if (value === 'true' || value === 'false') {
      return `${this.quoteIdent(key)} = ${value}`;
    }

    // Empty value = IS NULL (e.g., dismissed_at= means "not dismissed")
    if (value === '') {
      return `${this.quoteIdent(key)} IS NULL`;
    }

    return `${this.quoteIdent(key)} = '${this.escapeValue(value)}'`;
  }

  private splitFilterParts(inner: string): string[] {
    const parts: string[] = [];
    let depth = 0;
    let start = 0;
    for (let i = 0; i < inner.length; i++) {
      if (inner[i] === '(') {
        if (depth === 0) start = i;
        depth++;
      } else if (inner[i] === ')') {
        depth--;
        if (depth === 0) {
          parts.push(inner.slice(start, i + 1));
        }
      }
    }
    return parts;
  }

  /** Quote a SQL identifier (table/column name) — rejects unsafe characters */
  private quoteIdent(name: string): string {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
      throw new Error(`Invalid SQL identifier: ${name}`);
    }
    return `"${name}"`;
  }

  /** Escape a SQL string value */
  private escapeValue(value: string): string {
    return value.replace(/'/g, "''");
  }

  /** Convert a JS value to a SQL literal */
  private sqlValue(value: unknown): string {
    if (value === null) return 'NULL';
    if (typeof value === 'number') return String(value);
    if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
    if (typeof value === 'object') return `'${this.escapeValue(JSON.stringify(value))}'`;
    return `'${this.escapeValue(String(value))}'`;
  }

  // ===========================================================================
  // Hub mode internals
  // ===========================================================================

  private getClient(): DataProducerClient {
    if (!this.client || !this.connected()) {
      throw new Error('SmeMartDbService: Not connected. Call connect() first.');
    }
    return this.client;
  }

  private getHubCollectionsApi(): HubCollectionsApi {
    return this.getClient().getDataProducer().getCollectionsApi();
  }
}
