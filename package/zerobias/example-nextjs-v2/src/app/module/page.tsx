"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ProductExtended } from "@zerobias-com/portal-sdk";
import { HubConnectionProfile } from "@zerobias-org/types-core-js";
// The GitHub Hub SDK — the dedicated browser client for the GitHub module.
// `GithubHubImpl` extends the v2 HubConnector (same role as v1's `newGithub()`
// client, on the v2 stack). Runtime API from the package root; model types from
// its `/model` subpath export.
import { GithubHubImpl, OrganizationApi } from "@auditlogic/hub-sdk-github-github";
import type {
  Organization,
  Repository,
} from "@auditlogic/hub-sdk-github-github/model";
import { getZerobiasClientUrl } from "@zerobias-com/zerobias-client";
import { useSession } from "@/context/session-context";
import { env } from "@/lib/env";
import { toUserMessage } from "@/lib/errors";
import {
  ConnectionPicker,
  type ConnectionOption,
} from "@/components/ConnectionPicker";

// GitHub's product package code in the catalog — the entry point of the chain.
const GITHUB_PACKAGE_CODE = "github.github";

function statusValue(status: unknown): string | undefined {
  return typeof status === "string"
    ? status
    : (status as { value?: string })?.value;
}

// A connection/scope is only usable when its operational status is up or standby.
function isUsable(status: unknown): boolean {
  const v = statusValue(status);
  return v === "up" || v === "standby";
}

/**
 * Module Usage — the canonical "module chain":
 *
 *   product (github.github)     portalClient.getProductApi().search()
 *     -> module                 storeClient.getModuleApi().search({ products })
 *       -> connection           hubClient.getConnectionApi().search({ modules })
 *         -> scope              hubClient.getScopeApi().search({ connections })
 *           -> hub module client  new GithubHubImpl().connect(HubConnectionProfile)
 *
 * The first four hops are read-only platform discovery. The last hop builds a
 * `HubConnectionProfile(server, targetId, apiKey?, session?, orgId?)` and connects
 * a real GitHub client THROUGH the Hub — the Hub holds the connection's GitHub
 * credentials, so the browser never sees them. `targetId` is the scope id for a
 * multi-scope connection, or the connection id for a single-scope one.
 *
 * Requires a GitHub connection to already exist in the current org (created in the
 * portal). With no connection, the chain simply lists nothing.
 */
export default function ModulePage() {
  const { api, org, ready } = useSession();

  const [product, setProduct] = useState<ProductExtended | null>(null);
  const [connections, setConnections] = useState<ConnectionOption[]>([]);
  const [connectionId, setConnectionId] = useState("");
  const [scopes, setScopes] = useState<ScopeRow[]>([]);
  const [scopeId, setScopeId] = useState("");
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [orgName, setOrgName] = useState("");
  const [repos, setRepos] = useState<Repository[]>([]);

  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Monotonic run id, bumped on every user selection. Async results only apply
  // if their run is still the current one — so a slow response from a superseded
  // selection can't overwrite the current one (this is what fixes the race).
  const runIdRef = useRef(0);
  const isCurrent = (id: number) => runIdRef.current === id;
  // One connected client per target (connection/scope), reused across list calls
  // instead of reconnecting every time (reconnecting could race the Hub session).
  const clientsRef = useRef(new Map<string, GithubHubImpl>());
  // Debounce the connect step so rapidly flipping selections fires just one connect.
  const connectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Invalidate all in-flight work + clear the timer on unmount.
  useEffect(
    () => () => {
      runIdRef.current++;
      if (connectTimerRef.current) clearTimeout(connectTimerRef.current);
    },
    [],
  );

  // ---- Hop 1+2+3: product -> module -> connection ------------------------
  const loadConnections = useCallback(async () => {
    if (!api) return;
    const runId = ++runIdRef.current;
    clientsRef.current.clear(); // org may have changed — drop cached clients
    setConnectionId("");
    setScopes([]);
    setScopeId("");
    setOrgs([]);
    setOrgName("");
    setRepos([]);
    setBusy("Finding GitHub connections…");
    setError(null);
    try {
      // Hop 1 — the GitHub product.
      const products = await api.portalClient
        .getProductApi()
        .search({ packageCode: GITHUB_PACKAGE_CODE }, 1, 1);
      if (!isCurrent(runId)) return;
      const githubProduct = products.items[0];
      setProduct(githubProduct ?? null);
      if (!githubProduct) {
        setError("GitHub product not found in the catalog.");
        return;
      }

      // Hop 2 — modules implementing that product (computed, not shown — as in v1).
      const modules = await api.storeClient
        .getModuleApi()
        .search({ products: [githubProduct.id] }, 1, 50);
      if (!isCurrent(runId)) return;
      const moduleIds = modules.items.map((m) => m.id);
      if (moduleIds.length === 0) {
        setError("No modules implement the GitHub product.");
        return;
      }

      // Hop 3 — connections using those modules.
      const conns = await api.hubClient
        .getConnectionApi()
        .search({ modules: moduleIds }, 1, 50);
      if (!isCurrent(runId)) return;
      setConnections(
        conns.items.map((c) => ({
          id: c.id.toString(),
          name: c.name,
          // Raw operational status (e.g. "up") — the StatusDot maps it to a
          // color + solid/outlined dot, so keep the raw value here, not a
          // pre-formatted string.
          status: statusValue(c.status) ?? "unknown",
          usable: isUsable(c.status),
        })),
      );
    } catch (err) {
      if (!isCurrent(runId)) return;
      console.error("Failed to load GitHub connections", err);
      setError(toUserMessage(err));
    } finally {
      if (isCurrent(runId)) setBusy(null);
    }
  }, [api]);

  useEffect(() => {
    if (!ready || !api) return;
    // Defer off the synchronous effect phase — loadConnections sets state.
    const t = setTimeout(() => void loadConnections(), 0);
    return () => clearTimeout(t);
  }, [ready, api, loadConnections, org?.id]);

  // Debounced connect: only the last selection within the window fires a connect.
  const scheduleConnect = (targetId: string, runId: number) => {
    if (connectTimerRef.current) clearTimeout(connectTimerRef.current);
    connectTimerRef.current = setTimeout(() => {
      if (isCurrent(runId)) void connectAndListOrgs(targetId, runId);
    }, 300);
  };

  // ---- Hop 4: connection -> scope ---------------------------------------
  const chooseConnection = async (id: string) => {
    const runId = ++runIdRef.current; // supersede any in-flight work
    setConnectionId(id);
    setScopeId("");
    setScopes([]);
    setOrgs([]);
    setOrgName("");
    setRepos([]);
    setError(null);
    if (!api || !id) return;
    setBusy("Loading scopes…");
    try {
      const results = await api.hubClient
        .getScopeApi()
        .search({ connections: [api.toUUID(id)] }, 1, 50);
      if (!isCurrent(runId)) return;
      const rows: ScopeRow[] = results.items
        .map((s) => ({
          id: s.id.toString(),
          name: s.name,
          usable: isUsable(s.status),
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
      setScopes(rows);
      // Single scope -> use it directly; connect against the connection id.
      if (rows.length <= 1) {
        scheduleConnect(rows.length === 1 ? rows[0].id : id, runId);
      }
    } catch (err) {
      if (!isCurrent(runId)) return;
      console.error("Failed to load scopes", err);
      setError(toUserMessage(err));
    } finally {
      if (isCurrent(runId)) setBusy(null);
    }
  };

  const chooseScope = (id: string) => {
    const runId = ++runIdRef.current;
    setScopeId(id);
    setOrgs([]);
    setOrgName("");
    setRepos([]);
    setError(null);
    if (id) scheduleConnect(id, runId);
  };

  // ---- Hop 5: connect the GitHub Hub client (cached), list orgs ---------
  const connectClient = async (targetId: string): Promise<GithubHubImpl> => {
    const cached = clientsRef.current.get(targetId);
    if (cached) return cached; // reuse — don't reconnect for every list call
    // The Hub routes to the target connection/scope; it injects the stored
    // GitHub credentials server-side. But WE still have to authenticate the Hub
    // call itself — the Hub SDK client is a separate HTTP client, so it doesn't
    // inherit the platform clients' auth interceptor. Local dev authenticates
    // with the app's API key; in the browser we pass the platform SESSION id
    // (`api.getZerobiasSessionId()`), which the SDK sends as
    // `Authorization: session <id>` — matching danaClient/hubClient. Without it
    // the request has no Authorization header and the dana proxy returns 401.
    const sessionId = api!.getZerobiasSessionId();
    const profile = new HubConnectionProfile(
      getZerobiasClientUrl("hub", true, env.isLocalDev),
      api!.toUUID(targetId),
      env.isLocalDev ? env.apiKey : undefined,
      env.isLocalDev || !sessionId ? undefined : api!.toUUID(sessionId),
      org ? api!.toUUID(org.id) : undefined,
    );
    const client = new GithubHubImpl();
    await client.connect(profile);
    clientsRef.current.set(targetId, client); // cache only after a successful connect
    return client;
  };

  const connectAndListOrgs = async (targetId: string, runId: number) => {
    if (!api) return;
    setBusy("Connecting to GitHub via the Hub…");
    setError(null);
    try {
      const client = await connectClient(targetId);
      if (!isCurrent(runId)) return;
      const result = await client.getOrganizationApi().listMyOrganizations(1, 25);
      if (!isCurrent(runId)) return;
      setOrgs(result.items);
    } catch (err) {
      if (!isCurrent(runId)) return;
      console.error("Failed to list GitHub organizations", err);
      setError(toUserMessage(err));
    } finally {
      if (isCurrent(runId)) setBusy(null);
    }
  };

  // ---- Repositories for the chosen GitHub org ---------------------------
  const chooseOrg = async (name: string) => {
    const runId = ++runIdRef.current;
    setOrgName(name);
    setRepos([]);
    setError(null);
    if (!api || !name) return;
    // Active target (scope if chosen, else connection) — reuses the cached client.
    const targetId = scopeId || connectionId;
    setBusy("Loading repositories…");
    try {
      const client = await connectClient(targetId);
      if (!isCurrent(runId)) return;
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
      if (!isCurrent(runId)) return;
      setRepos(result.items);
    } catch (err) {
      if (!isCurrent(runId)) return;
      console.error("Failed to list repositories", err);
      setError(toUserMessage(err));
    } finally {
      if (isCurrent(runId)) setBusy(null);
    }
  };

  return (
    <div>
      <h1>Module Usage — GitHub</h1>
      <p className="subtitle">
        The module chain: <code>product → module → connection → scope → hub
        client</code>. Pick a GitHub connection to list an org&apos;s
        repositories through the Hub.
      </p>

      {error && (
        <p className="state error" role="alert">
          Error: {error}
        </p>
      )}

      <div className="form-card">
        <div className="field">
          <label>Product</label>
          <input value={product?.name ?? "GitHub"} readOnly />
        </div>

        <div className="field">
          <label htmlFor="mc-connection">Connection ({connections.length})</label>
          <ConnectionPicker
            id="mc-connection"
            connections={connections}
            value={connectionId}
            onChange={chooseConnection}
            disabled={connections.length === 0}
          />
        </div>

        {scopes.length > 1 && (
          <div className="field">
            <label htmlFor="mc-scope">Scope ({scopes.length})</label>
            <select
              id="mc-scope"
              value={scopeId}
              onChange={(e) => chooseScope(e.target.value)}
            >
              <option value="">Select a scope</option>
              {scopes.map((s) => (
                <option key={s.id} value={s.id} disabled={!s.usable}>
                  {s.name}
                  {s.usable ? "" : " (unavailable)"}
                </option>
              ))}
            </select>
          </div>
        )}

        {orgs.length > 0 && (
          <div className="field">
            <label htmlFor="mc-org">GitHub Org ({orgs.length})</label>
            <select
              id="mc-org"
              value={orgName}
              onChange={(e) => chooseOrg(e.target.value)}
            >
              <option value="">Select a GitHub org</option>
              {orgs.map((o) => (
                <option key={o.id} value={o.name}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {busy && <p className="state">{busy}</p>}

      <h2>Repositories {repos.length > 0 ? `(${repos.length})` : ""}</h2>
      {repos.length === 0 ? (
        <p className="state">
          {orgName ? "No repositories." : "Pick a connection and GitHub org above."}
        </p>
      ) : (
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Default Branch</th>
              </tr>
            </thead>
            <tbody>
              {repos.map((r) => (
                <tr key={r.id}>
                  <td>
                    <code>{r.name}</code>
                  </td>
                  <td>{r.description ?? "—"}</td>
                  <td>{r.defaultBranch ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

type ScopeRow = { id: string; name: string; usable: boolean };
