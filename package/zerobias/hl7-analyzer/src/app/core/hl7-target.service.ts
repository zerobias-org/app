import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { HubConnectionProfile } from '@zerobias-org/types-core-js';
import { getZerobiasClientUrl } from '@zerobias-com/zerobias-client';
import { DynamicDataProducerHubImpl } from '@zerobias-org/hub-sdk-interface-dataproducer';

import { environment } from '../../environments/environment';
import { SessionService } from './session.service';

/**
 * Picks the HL7 feed to work against, and hands out a connected DataProducer client.
 *
 * The chain is the standard Hub one — the org (chosen in the header switcher) owns connections, and
 * a connection is reached through its module:
 *
 *   storeClient.getModuleApi().search({ key: MODULE_KEY })   -> the HL7 receiver module
 *   hubClient.getConnectionApi().search({ modules: [...] })  -> connections deployed from it
 *   hubClient.getScopeApi().search({ connections: [id] })    -> scopes under the chosen connection
 *   new DynamicDataProducerHubImpl().connect(profile)        -> a live client for that target
 *
 * The **target** is the scope when one exists, else the connection — that id is what the Hub proxies
 * calls to. Every module call in this app goes through the returned SDK client
 * (`getCollectionsApi()` / `getFunctionsApi()` / `getSchemasApi()` / `getObjectsApi()`); nothing in
 * the app speaks to `/api/hub/targets/...` directly.
 *
 * We filter modules by `key` rather than going product-first. The receiver advertises two products
 * (`product-hl7-hl7` and `product-auditmation-generic-dataproducer`), and a `packageCode` product
 * search comes back empty on UAT, which would leave the picker mysteriously blank. The module key is
 * exact, always present, and is what the connection actually records.
 */

/** The receiver module. Any connection deployed from it can serve this app. */
export const HL7_MODULE_KEY = '@zerobias-org/module-hl7-v2';

/** Where the picker's selection is remembered, per org. */
const STORAGE_KEY = 'hl7-analyzer.target';

export interface Hl7Connection {
  readonly id: string;
  readonly name: string;
  readonly status: string;
  /** False for a connection the Hub reports as down — selectable, but flagged in the UI. */
  readonly usable: boolean;
}

export type Hl7Scope = Hl7Connection;

/** What the picker is doing right now, so pages can show one honest line of state. */
export type TargetPhase = 'idle' | 'loading' | 'connecting' | 'ready' | 'error';

@Injectable({ providedIn: 'root' })
export class Hl7TargetService {
  private readonly session = inject(SessionService);

  readonly connections = signal<readonly Hl7Connection[]>([]);
  readonly scopes = signal<readonly Hl7Scope[]>([]);
  readonly connectionId = signal('');
  readonly scopeId = signal('');
  readonly phase = signal<TargetPhase>('idle');
  readonly error = signal<string | null>(null);

  /** The id the Hub proxies to: the scope when one is chosen, else the connection. */
  readonly targetId = computed(() => this.scopeId() || this.connectionId());

  /** True once a client for the current target is connected and usable. */
  readonly connected = computed(() => this.phase() === 'ready' && !!this.targetId());

  /**
   * One connected client per target. Connecting twice for the same target would race the Hub, and
   * every page shares this service, so the cache is the coordination point.
   */
  private readonly clients = new Map<string, DynamicDataProducerHubImpl>();
  /** In-flight connects, so concurrent callers await the same promise instead of racing. */
  private readonly connecting = new Map<string, Promise<DynamicDataProducerHubImpl>>();

  /**
   * Monotonic run id, bumped on every selection. A slow response from a superseded selection must
   * not overwrite the current one — same guard as the example app's module page.
   */
  private runId = 0;
  private isCurrent(id: number): boolean {
    return this.runId === id;
  }

  constructor() {
    // The org owns the connections, so a switch invalidates every cached client and the whole list.
    effect(() => {
      const api = this.session.api();
      this.session.org()?.id;
      if (!this.session.ready() || !api) return;
      queueMicrotask(() => void this.loadConnections());
    });
  }

  /** Load the connections for this org's HL7 receiver module, then restore/auto-pick a target. */
  async loadConnections(): Promise<void> {
    const api = this.session.api();
    if (!api) return;
    const runId = ++this.runId;
    this.clients.clear();
    this.connecting.clear();
    this.connections.set([]);
    this.scopes.set([]);
    this.connectionId.set('');
    this.scopeId.set('');
    this.error.set(null);
    this.phase.set('loading');
    try {
      const modules = await api.storeClient.getModuleApi().search({ key: HL7_MODULE_KEY }, 1, 50);
      if (!this.isCurrent(runId)) return;
      const moduleIds = modules.items.map((m) => m.id);
      if (moduleIds.length === 0) {
        this.phase.set('error');
        this.error.set(`No module found with key ${HL7_MODULE_KEY}.`);
        return;
      }

      const conns = await api.hubClient.getConnectionApi().search({ modules: moduleIds }, 1, 50);
      if (!this.isCurrent(runId)) return;
      const rows = conns.items
        .map((c) => ({
          id: c.id.toString(),
          name: c.name,
          status: String(c.status ?? 'unknown'),
          usable: String(c.status ?? '') === 'up',
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
      this.connections.set(rows);
      this.phase.set('idle');

      if (rows.length === 0) {
        this.error.set('This org has no HL7 receiver connection.');
        return;
      }
      // Restore last choice when it still exists, else auto-pick a lone connection.
      const remembered = this.readRemembered();
      const restore = remembered && rows.some((r) => r.id === remembered.connectionId);
      if (restore) {
        await this.chooseConnection(remembered!.connectionId, remembered!.scopeId);
      } else if (rows.length === 1) {
        await this.chooseConnection(rows[0].id);
      }
    } catch (err) {
      if (!this.isCurrent(runId)) return;
      this.phase.set('error');
      this.error.set(messageOf(err));
    }
  }

  /**
   * Select a connection and load its scopes. A single scope (the common case — the receiver ships a
   * default scope) is selected for you; none means the connection id is itself the target.
   *
   * @param preferScopeId a remembered scope to re-select, if it is still present.
   */
  async chooseConnection(id: string, preferScopeId?: string): Promise<void> {
    const runId = ++this.runId;
    this.connectionId.set(id);
    this.scopeId.set('');
    this.scopes.set([]);
    this.error.set(null);
    const api = this.session.api();
    if (!api || !id) return;
    this.phase.set('loading');
    try {
      const results = await api.hubClient
        .getScopeApi()
        .search({ connections: [api.toUUID(id)] }, 1, 50);
      if (!this.isCurrent(runId)) return;
      const rows = results.items
        .map((s) => ({
          id: s.id.toString(),
          name: s.name,
          status: String(s.status ?? 'unknown'),
          usable: String(s.status ?? '') === 'up',
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
      this.scopes.set(rows);

      const preferred = preferScopeId ? rows.find((r) => r.id === preferScopeId) : undefined;
      if (preferred) {
        this.chooseScope(preferred.id);
      } else if (rows.length === 1) {
        this.chooseScope(rows[0].id);
      } else {
        // No scopes -> the connection itself is the target, so the choice is already complete.
        // Several scopes -> wait for the user; nothing to remember until they pick.
        if (rows.length === 0) this.remember();
        this.phase.set('idle');
      }
    } catch (err) {
      if (!this.isCurrent(runId)) return;
      this.phase.set('error');
      this.error.set(messageOf(err));
    }
  }

  chooseScope(id: string): void {
    this.scopeId.set(id);
    this.error.set(null);
    this.remember();
    this.phase.set('idle');
  }

  /**
   * The connected client for the current target, connecting on first use.
   *
   * Pages call this instead of holding a client: a connect is cheap to await, impossible to
   * duplicate (both caches above), and re-selecting a target simply invalidates it.
   */
  async producer(): Promise<DynamicDataProducerHubImpl> {
    const targetId = this.targetId();
    if (!targetId) throw new Error('No HL7 connection selected.');
    const cached = this.clients.get(targetId);
    if (cached) return cached;
    const inFlight = this.connecting.get(targetId);
    if (inFlight) return inFlight;

    const api = this.session.api();
    if (!api) throw new Error('The ZeroBias session is not ready yet.');

    const promise = (async () => {
      const sessionId = api.getZerobiasSessionId();
      const profile = new HubConnectionProfile(
        getZerobiasClientUrl('hub', true, environment.isLocalDev),
        api.toUUID(targetId),
        // Local dev: proxy.conf.js injects `Authorization: APIKey ...` on /api/*, so no key here.
        undefined,
        environment.isLocalDev || !sessionId ? undefined : api.toUUID(sessionId),
        this.session.org() ? api.toUUID(this.session.org()!.id) : undefined,
      );
      const client = new DynamicDataProducerHubImpl();
      await client.connect(profile);
      this.clients.set(targetId, client); // cache only after a successful connect
      return client;
    })();

    this.connecting.set(targetId, promise);
    this.phase.set('connecting');
    try {
      const client = await promise;
      this.phase.set('ready');
      return client;
    } catch (err) {
      this.phase.set('error');
      this.error.set(messageOf(err));
      throw err;
    } finally {
      this.connecting.delete(targetId);
    }
  }

  // --- selection memory -------------------------------------------------------------------
  // Keyed by org: the same browser can hold sessions for orgs with different connections, and
  // restoring another org's target would silently point the app at the wrong feed.

  private storageKey(): string | null {
    const orgId = this.session.org()?.id;
    return orgId ? `${STORAGE_KEY}.${orgId}` : null;
  }

  private remember(): void {
    const key = this.storageKey();
    if (!key) return;
    try {
      localStorage.setItem(
        key,
        JSON.stringify({ connectionId: this.connectionId(), scopeId: this.scopeId() }),
      );
    } catch {
      // Private-mode / quota — remembering is a convenience, never a requirement.
    }
  }

  private readRemembered(): { connectionId: string; scopeId: string } | null {
    const key = this.storageKey();
    if (!key) return null;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { connectionId?: string; scopeId?: string };
      if (!parsed?.connectionId) return null;
      return { connectionId: parsed.connectionId, scopeId: parsed.scopeId ?? '' };
    } catch {
      return null;
    }
  }
}

/** Hub errors arrive in several shapes; pull out something a user can act on. */
export function messageOf(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'string') return err;
  const anyErr = err as { message?: string; template?: string; key?: string } | null;
  return anyErr?.message ?? anyErr?.template ?? anyErr?.key ?? 'Unexpected error';
}
