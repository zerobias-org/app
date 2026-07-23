import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import type { ProductExtended } from '@zerobias-com/portal-sdk';
import { HubConnectionProfile } from '@zerobias-org/types-core-js';
// The GitHub Hub SDK — the dedicated browser client for the GitHub module. `GithubHubImpl`
// extends the v2 HubConnector. Runtime API from the package root; model types from `/model`.
import { GithubHubImpl, OrganizationApi } from '@auditlogic/hub-sdk-github-github';
import type { Organization, Repository } from '@auditlogic/hub-sdk-github-github/model';
import { getZerobiasClientUrl } from '@zerobias-com/zerobias-client';

import { CallReveal } from '../../shared/call-reveal/call-reveal';
import { SessionService } from '../../core/session.service';
import { environment } from '../../../environments/environment';

/**
 * One executed hop of the chain, shown in the right-hand column: the call as it was made plus the
 * platform's ACTUAL response. Unlike the write demos elsewhere in this app (which reveal a call
 * that is never sent), every entry here is a request that really went out.
 */
interface CallLogEntry {
  /** Stable per hop, so re-running a hop replaces its entry instead of appending a duplicate. */
  readonly key: string;
  readonly title: string;
  readonly call: string;
  readonly response: unknown;
}

/**
 * Responses here can be large (50 connections, 25 repos) and a code panel showing 900 lines of JSON
 * teaches nothing. Collapse paged results to their shape plus the first few items.
 */
const SAMPLE = 3;
function summarize(value: unknown): unknown {
  const paged = value as { items?: unknown[]; count?: number; total?: number };
  if (paged && Array.isArray(paged.items)) {
    const shown = paged.items.slice(0, SAMPLE);
    return {
      count: paged.count ?? paged.total ?? paged.items.length,
      items: shown,
      ...(paged.items.length > shown.length
        ? { '…': `${paged.items.length - shown.length} more item(s) not shown` }
        : {}),
    };
  }
  if (Array.isArray(value)) {
    const shown = value.slice(0, SAMPLE);
    return value.length > shown.length
      ? { items: shown, '…': `${value.length - shown.length} more item(s) not shown` }
      : shown;
  }
  return value;
}

/** GitHub's product package code in the catalog — the entry point of the chain. */
const GITHUB_PACKAGE_CODE = 'github.github';

interface Picked {
  readonly id: string;
  readonly name: string;
  readonly status: string;
  readonly usable: boolean;
}

function statusValue(status: unknown): string | undefined {
  return typeof status === 'string' ? status : (status as { value?: string })?.value;
}

/** A connection/scope is only usable when its operational status is up or standby. */
function isUsable(status: unknown): boolean {
  const v = statusValue(status);
  return v === 'up' || v === 'standby';
}

/**
 * Module Usage — the canonical "module chain" (twin of example-nextjs-v2's `app/module/page.tsx`):
 *
 *   product (github.github)   portalClient.getProductApi().search()
 *     -> module               storeClient.getModuleApi().search({ products })
 *       -> connection         hubClient.getConnectionApi().search({ modules })
 *         -> scope            hubClient.getScopeApi().search({ connections })
 *           -> hub client     new GithubHubImpl().connect(HubConnectionProfile)
 *
 * The first four hops are read-only platform discovery. The last builds a
 * `HubConnectionProfile(server, targetId, apiKey?, session?, orgId?)` and connects a real GitHub
 * client THROUGH the Hub — the Hub holds the connection's GitHub credentials, so the browser never
 * sees them. `targetId` is the scope id for a multi-scope connection, or the connection id for a
 * single-scope one.
 *
 * AUTH DIFFERS FROM THE REACT TWIN. There, `env.apiKey` (`NEXT_PUBLIC_API_KEY`) is readable in the
 * browser and passed into the profile. Here it is not: local dev authenticates through
 * `proxy.conf.js`, which injects `Authorization: APIKey …` on every `/api/*` request. The hub URL
 * resolves to `${location.host}/api/hub`, so those calls go through that same proxy and are
 * authenticated server-side — hence `apiKey: undefined` locally. Deployed, we pass the platform
 * session id, which the SDK sends as `Authorization: session <id>` (the Hub SDK is a separate HTTP
 * client and does not inherit the platform clients' auth interceptor).
 *
 * Requires a GitHub connection to already exist in the current org (created in the portal). With no
 * connection the chain simply lists nothing.
 */
@Component({
  selector: 'app-module-usage',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, CallReveal],
  template: `
    <h1>Module Usage — GitHub</h1>
    <p class="subtitle">
      The module chain: <code>product → module → connection → scope → hub client</code>. The first
      four hops are platform discovery; the last connects a real GitHub client through the Hub,
      which injects the stored credentials server-side.
    </p>

    @if (error(); as e) {
      <p class="state error" role="alert">Error: {{ e }}</p>
    }

    <div class="layout">
    <div class="main">

    <section class="panel">
      <div class="field">
        <label>Product</label>
        <div class="value">
          @if (product(); as p) {
            <code>{{ GITHUB_PACKAGE_CODE }}</code> — {{ p.name }}
          } @else {
            <span class="state">—</span>
          }
        </div>
      </div>

      <div class="field">
        <label for="conn">Connection</label>
        <select id="conn" [value]="connectionId()" (change)="chooseConnection($any($event.target).value)">
          <option value="">Select a connection…</option>
          @for (c of connections(); track c.id) {
            <option [value]="c.id" [disabled]="!c.usable">{{ c.name }} ({{ c.status }})</option>
          }
        </select>
        @if (connections().length === 0 && !busy()) {
          <p class="hint">No GitHub connections in this org — create one in the portal.</p>
        }
      </div>

      @if (scopes().length > 1) {
        <div class="field">
          <label for="scope">Scope</label>
          <select id="scope" [value]="scopeId()" (change)="chooseScope($any($event.target).value)">
            <option value="">Select a scope…</option>
            @for (s of scopes(); track s.id) {
              <option [value]="s.id" [disabled]="!s.usable">{{ s.name }}</option>
            }
          </select>
        </div>
      }

      @if (orgs().length) {
        <div class="field">
          <label for="ghorg">GitHub organization</label>
          <select id="ghorg" [value]="orgName()" (change)="chooseOrg($any($event.target).value)">
            <option value="">Select an organization…</option>
            @for (o of orgs(); track o.id) {
              <option [value]="o.name">{{ o.name }}</option>
            }
          </select>
        </div>
      }
    </section>

    @if (busy(); as b) {
      <p class="state">{{ b }}</p>
    }

    <h2>Repositories <span class="count">{{ repos().length ? '(' + repos().length + ')' : '' }}</span></h2>
    @if (repos().length === 0) {
      <p class="state">
        Pick a connection @if (scopes().length > 1) { (and scope) } and a GitHub organization to
        list repositories.
      </p>
    } @else {
      <div class="table-scroll">
        <table class="table">
          <thead>
            <tr><th>Name</th><th>Visibility</th><th>Default branch</th><th>Updated</th></tr>
          </thead>
          <tbody>
            @for (r of repos(); track r.id) {
              <tr>
                <td>{{ r.fullName ?? r.name }}</td>
                <td>
                  <!-- GitHub returns a visibility string (public/private/internal); _private is
                       the older boolean. Prefer the string, fall back to the boolean. -->
                  <span [class]="'zb-chip square visibility ' + visibilityOf(r)">
                    {{ visibilityOf(r) }}
                  </span>
                </td>
                <td>{{ r.defaultBranch ?? '—' }}</td>
                <td>{{ r.updated ? (r.updated | date: 'short') : '—' }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }

    </div>

    <aside class="calls" aria-label="Calls made">
      <h2>Calls</h2>
      <p class="subtitle">
        Every request this page actually sent, in order, with the platform's real response. Paged
        results are trimmed to their shape plus the first {{ SAMPLE }} items.
      </p>
      @if (log().length === 0) {
        <p class="state">No calls yet.</p>
      } @else {
        @for (entry of log(); track entry.key) {
          <section class="call">
            <h3>{{ entry.title }}</h3>
            <app-call-reveal [call]="entry.call" [response]="entry.response" [live]="true" />
          </section>
        }
      }
    </aside>
    </div>
  `,
  styles: `
    :host { display: block; }
    /* Two columns: the chain UI on the left, the executed calls on the right. minmax(0,1fr)
       so the code panels can shrink instead of forcing the page to scroll sideways. */
    .layout { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: var(--zb-spacing-lg); align-items: start; }
    @media (max-width: 1100px) { .layout { grid-template-columns: minmax(0, 1fr); } }
    .main { min-width: 0; }
    .calls { min-width: 0; border-left: 1px solid var(--zb-divider); padding-left: var(--zb-spacing-lg); }
    @media (max-width: 1100px) { .calls { border-left: none; padding-left: 0; border-top: 1px solid var(--zb-divider); padding-top: var(--zb-spacing-md); } }
    .calls h2 { margin-top: 0; }
    .call { margin-bottom: var(--zb-spacing-md); }
    .call h3 { margin: 0 0 var(--zb-spacing-xs); font-size: 14px; color: var(--zb-secondary-text); font-weight: 600; }
    h1 { margin: 0 0 var(--zb-spacing-xs); font-size: 26px; }
    h2 { margin: var(--zb-spacing-lg) 0 var(--zb-spacing-sm); font-size: 18px; }
    .count { color: var(--zb-secondary-text); font-weight: 400; font-size: var(--zb-font-size-sm); }
    .subtitle { margin: 0 0 var(--zb-spacing-md); color: var(--zb-secondary-text); font-size: var(--zb-font-size-sm); }
    .panel { border: 1px solid var(--zb-divider); border-radius: 8px; padding: var(--zb-spacing-md); display: flex; flex-direction: column; gap: var(--zb-spacing-md); }
    .field { display: grid; grid-template-columns: 160px 1fr; align-items: center; gap: var(--zb-spacing-sm); }
    .field label { color: var(--zb-secondary-text); font-size: var(--zb-font-size-sm); }
    .field select {
      height: 38px; padding: 0 var(--zb-spacing-sm);
      background: var(--zb-background); color: var(--zb-text);
      border: 1px solid var(--zb-divider); border-radius: 6px;
      font: inherit; font-size: var(--zb-font-size-md);
    }
    .field .value { color: var(--zb-text); }
    .hint { grid-column: 2; margin: 0; color: var(--zb-secondary-text); font-size: var(--zb-font-size-sm); }
    .table-scroll { overflow-x: auto; }
    .table { width: 100%; border-collapse: collapse; }
    .table th, .table td { text-align: left; padding: var(--zb-spacing-sm); border-bottom: 1px solid var(--zb-divider); }
    .table th { color: var(--zb-secondary-text); font-weight: 500; font-size: var(--zb-font-size-sm); }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; color: var(--zb-primary); }
    .state { color: var(--zb-secondary-text); }
    .state.error { color: var(--zb-color-error); }
  `,
})
export class ModuleUsage {
  protected readonly GITHUB_PACKAGE_CODE = GITHUB_PACKAGE_CODE;
  protected readonly SAMPLE = SAMPLE;
  private readonly session = inject(SessionService);

  protected readonly product = signal<ProductExtended | null>(null);
  protected readonly connections = signal<readonly Picked[]>([]);
  protected readonly connectionId = signal('');
  protected readonly scopes = signal<readonly Picked[]>([]);
  protected readonly scopeId = signal('');
  protected readonly orgs = signal<readonly Organization[]>([]);
  protected readonly orgName = signal('');
  protected readonly repos = signal<readonly Repository[]>([]);
  protected readonly busy = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);

  /** The executed chain, newest hop last — rendered as code panels in the right column. */
  protected readonly log = signal<readonly CallLogEntry[]>([]);

  /** Append a hop, or replace it if that hop ran before (re-selecting a connection, say). */
  private record(key: string, title: string, call: string, response: unknown): void {
    const entry: CallLogEntry = { key, title, call, response: summarize(response) };
    this.log.update((prev) => {
      const i = prev.findIndex((e) => e.key === key);
      if (i === -1) return [...prev, entry];
      const next = [...prev];
      next[i] = entry;
      return next;
    });
  }

  /** Drop hops that a new selection invalidates, so the log never shows stale downstream calls. */
  private truncateLog(...keys: readonly string[]): void {
    this.log.update((prev) => prev.filter((e) => !keys.includes(e.key)));
  }

  /**
   * Monotonic run id, bumped on every user selection. An async result is only applied if its run
   * is still current — otherwise a slow response from a superseded selection could overwrite the
   * current one. Same guard as the React twin's `runIdRef`.
   */
  private runId = 0;
  private isCurrent(id: number): boolean {
    return this.runId === id;
  }

  /** One connected client per target, reused across list calls — reconnecting could race the Hub. */
  private readonly clients = new Map<string, GithubHubImpl>();
  private connectTimer?: ReturnType<typeof setTimeout>;

  /** The target currently in play: the scope when one is chosen, else the connection. */
  private readonly targetId = computed(() => this.scopeId() || this.connectionId());

  constructor() {
    // Reload the chain whenever the session is ready or the org changes — the org owns the
    // connections, so a switch invalidates every cached client.
    effect(() => {
      const api = this.session.api();
      this.session.org()?.id;
      if (!this.session.ready() || !api) return;
      queueMicrotask(() => void this.loadConnections());
    });
  }

  private reset(): void {
    this.connectionId.set('');
    this.scopes.set([]);
    this.scopeId.set('');
    this.orgs.set([]);
    this.orgName.set('');
    this.repos.set([]);
  }

  /** Hops 1-3: product -> modules -> connections. */
  private async loadConnections(): Promise<void> {
    const api = this.session.api();
    if (!api) return;
    const runId = ++this.runId;
    this.clients.clear();
    this.reset();
    this.log.set([]);
    this.busy.set('Finding GitHub connections…');
    this.error.set(null);
    try {
      const products = await api.portalClient
        .getProductApi()
        .search({ packageCode: GITHUB_PACKAGE_CODE }, 1, 1);
      if (!this.isCurrent(runId)) return;
      this.record(
        'product',
        '1 · Product',
        `await portalClient.getProductApi()\n  .search({ packageCode: "${GITHUB_PACKAGE_CODE}" }, 1, 1);`,
        products,
      );
      const githubProduct = products.items[0];
      this.product.set(githubProduct ?? null);
      if (!githubProduct) {
        this.error.set('GitHub product not found in the catalog.');
        return;
      }

      // Modules implementing that product (computed, not shown — as in the React twin).
      const modules = await api.storeClient
        .getModuleApi()
        .search({ products: [githubProduct.id] }, 1, 50);
      if (!this.isCurrent(runId)) return;
      this.record(
        'modules',
        '2 · Modules',
        `await storeClient.getModuleApi()\n  .search({ products: ["${githubProduct.id}"] }, 1, 50);`,
        modules,
      );
      const moduleIds = modules.items.map((m) => m.id);
      if (moduleIds.length === 0) {
        this.error.set('No modules implement the GitHub product.');
        return;
      }

      const conns = await api.hubClient.getConnectionApi().search({ modules: moduleIds }, 1, 50);
      if (!this.isCurrent(runId)) return;
      this.record(
        'connections',
        '3 · Connections',
        `await hubClient.getConnectionApi()\n  .search({ modules: [/* ${moduleIds.length} module id(s) */] }, 1, 50);`,
        conns,
      );
      this.connections.set(
        conns.items.map((c) => ({
          id: c.id.toString(),
          name: c.name,
          status: statusValue(c.status) ?? 'unknown',
          usable: isUsable(c.status),
        })),
      );
    } catch (err) {
      if (!this.isCurrent(runId)) return;
      console.error('Failed to load GitHub connections', err);
      this.error.set(this.message(err));
    } finally {
      if (this.isCurrent(runId)) this.busy.set(null);
    }
  }

  /** Hop 4: connection -> scopes. A single scope connects straight through. */
  protected async chooseConnection(id: string): Promise<void> {
    const runId = ++this.runId;
    this.connectionId.set(id);
    this.scopeId.set('');
    this.scopes.set([]);
    this.orgs.set([]);
    this.orgName.set('');
    this.repos.set([]);
    this.error.set(null);
    this.truncateLog('scopes', 'connect', 'orgs', 'repos');
    const api = this.session.api();
    if (!api || !id) return;
    this.busy.set('Loading scopes…');
    try {
      const results = await api.hubClient
        .getScopeApi()
        .search({ connections: [api.toUUID(id)] }, 1, 50);
      if (!this.isCurrent(runId)) return;
      this.record(
        'scopes',
        '4 · Scopes',
        `await hubClient.getScopeApi()\n  .search({ connections: ["${id}"] }, 1, 50);`,
        results,
      );
      const rows = results.items
        .map((s) => ({
          id: s.id.toString(),
          name: s.name,
          status: statusValue(s.status) ?? 'unknown',
          usable: isUsable(s.status),
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
      this.scopes.set(rows);
      // Single scope -> use it directly; none -> connect against the connection id.
      if (rows.length <= 1) this.scheduleConnect(rows.length === 1 ? rows[0].id : id, runId);
    } catch (err) {
      if (!this.isCurrent(runId)) return;
      console.error('Failed to load scopes', err);
      this.error.set(this.message(err));
    } finally {
      if (this.isCurrent(runId)) this.busy.set(null);
    }
  }

  protected chooseScope(id: string): void {
    const runId = ++this.runId;
    this.scopeId.set(id);
    this.orgs.set([]);
    this.orgName.set('');
    this.repos.set([]);
    this.error.set(null);
    if (id) this.scheduleConnect(id, runId);
  }

  /** Debounced so rapidly flipping selections fires just one connect. */
  private scheduleConnect(targetId: string, runId: number): void {
    if (this.connectTimer) clearTimeout(this.connectTimer);
    this.connectTimer = setTimeout(() => {
      if (this.isCurrent(runId)) void this.connectAndListOrgs(targetId, runId);
    }, 300);
  }

  /** Hop 5: connect a GitHub client through the Hub. Cached per target. */
  private async connectClient(targetId: string): Promise<GithubHubImpl> {
    const cached = this.clients.get(targetId);
    if (cached) return cached;
    const api = this.session.api()!;
    const sessionId = api.getZerobiasSessionId();
    const profile = new HubConnectionProfile(
      getZerobiasClientUrl('hub', true, environment.isLocalDev),
      api.toUUID(targetId),
      // Local dev: proxy.conf.js injects the API key on /api/* — see the class comment.
      undefined,
      environment.isLocalDev || !sessionId ? undefined : api.toUUID(sessionId),
      this.session.org() ? api.toUUID(this.session.org()!.id) : undefined,
    );
    const client = new GithubHubImpl();
    await client.connect(profile);
    this.clients.set(targetId, client); // cache only after a successful connect
    return client;
  }

  private async connectAndListOrgs(targetId: string, runId: number): Promise<void> {
    if (!this.session.api()) return;
    this.busy.set('Connecting to GitHub via the Hub…');
    this.error.set(null);
    try {
      const client = await this.connectClient(targetId);
      if (!this.isCurrent(runId)) return;
      this.record(
        'connect',
        '5 · Connect through the Hub',
        [
          `const profile = new HubConnectionProfile(`,
          `  getZerobiasClientUrl("hub", true, isLocalDev),  // ${getZerobiasClientUrl('hub', true, environment.isLocalDev)}`,
          `  targetId,   // "${targetId}" — scope id, or connection id when single-scope`,
          `  apiKey,     // local dev: undefined — proxy.conf.js injects Authorization`,
          `  sessionId,  // deployed: sent as "Authorization: session <id>"`,
          `  orgId,`,
          `);`,
          `const client = new GithubHubImpl();`,
          `await client.connect(profile);   // Hub injects the stored GitHub credentials`,
        ].join('\n'),
        { connected: true, targetId, note: 'connect() resolves void — the client is now usable' },
      );
      const result = await client.getOrganizationApi().listMyOrganizations(1, 25);
      if (!this.isCurrent(runId)) return;
      this.record(
        'orgs',
        '6 · GitHub organizations',
        `await client.getOrganizationApi()\n  .listMyOrganizations(1, 25);`,
        result,
      );
      this.orgs.set(result.items);
    } catch (err) {
      if (!this.isCurrent(runId)) return;
      console.error('Failed to list GitHub organizations', err);
      this.error.set(this.message(err));
    } finally {
      if (this.isCurrent(runId)) this.busy.set(null);
    }
  }

  /** Repositories for the chosen GitHub org, through the cached client. */
  protected async chooseOrg(name: string): Promise<void> {
    const runId = ++this.runId;
    this.orgName.set(name);
    this.repos.set([]);
    this.error.set(null);
    this.truncateLog('repos');
    if (!this.session.api() || !name) return;
    this.busy.set('Loading repositories…');
    try {
      const client = await this.connectClient(this.targetId());
      if (!this.isCurrent(runId)) return;
      const result = await client
        .getOrganizationApi()
        .listRepositories(
          name,
          OrganizationApi.TypeEnum.All,
          OrganizationApi.SortEnum.FullName,
          OrganizationApi.DirectionEnum.Asc,
          1,
          25,
        );
      if (!this.isCurrent(runId)) return;
      this.record(
        'repos',
        '7 · Repositories',
        [
          `await client.getOrganizationApi().listRepositories(`,
          `  "${name}",`,
          `  OrganizationApi.TypeEnum.All,`,
          `  OrganizationApi.SortEnum.FullName,`,
          `  OrganizationApi.DirectionEnum.Asc,`,
          `  1, 25,`,
          `);`,
        ].join('\n'),
        result,
      );
      this.repos.set(result.items);
    } catch (err) {
      if (!this.isCurrent(runId)) return;
      console.error('Failed to list repositories', err);
      this.error.set(this.message(err));
    } finally {
      if (this.isCurrent(runId)) this.busy.set(null);
    }
  }

  /** GitHub's `visibility` string when present, else the older `_private` boolean. */
  protected visibilityOf(r: Repository): string {
    return r.visibility ?? (r._private ? 'private' : 'public');
  }

  private message(err: unknown): string {
    return err instanceof Error ? err.message : String(err);
  }
}
