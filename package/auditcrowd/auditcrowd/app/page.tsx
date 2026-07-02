"use client";
import { useEffect, useState } from "react";
import { ShieldCheck, Server, Fingerprint, Layers, BadgeCheck } from "lucide-react";
import AppToolbar from "@/components/ui/appToolbar";
import { useCurrentUser } from "@/context/CurrentUserContext";

const ZB_KEY = process.env.NEXT_PUBLIC_API_KEY;

function initials(name?: string): string {
  if (!name) return "—";
  const parts = name.trim().split(/\s+/);
  if (parts.length > 1) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

type Seam = { ok: boolean; backend?: string; zb_user?: { id?: string; name?: string; type?: string }; error?: string };
type Summary = {
  ok: boolean;
  counts?: { engagements: number; opportunities: number; history: number };
  engagements?: { id: string; name: string; org: string; boundary: string; frameworks: string[]; status: string; live?: boolean }[];
  opportunities?: { id: string; title: string; frameworks: string[] }[];
};

export default function Dashboard() {
  const { user, org } = useCurrentUser();
  const [seam, setSeam] = useState<Seam | null>(null);
  const [seamState, setSeamState] = useState<"loading" | "ok" | "down">("loading");
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    const headers: Record<string, string> = ZB_KEY ? { Authorization: `APIKey ${ZB_KEY}` } : {};
    // The customer-backend seam: our own AuditCrowd API validates the ZB identity.
    fetch("/backend/zb/whoami", { headers })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: Seam) => { setSeam(d); setSeamState("ok"); })
      .catch(() => setSeamState("down"));

    fetch("/backend/zb/summary", { headers })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: Summary) => setSummary(d))
      .catch(() => setSummary(null));
  }, []);

  const email = user?.emails?.[0] ?? user?.email;
  const counts = summary?.counts;

  return (
    <div className="ac-shell">
      <AppToolbar />

      <main className="ac-main ac-wrap">
        <header className="ac-head">
          <span className="pill"><span className="dot" /> Live on the ZeroBias transparency architecture</span>
          <h1>Welcome{user?.name ? `, ${user.name.split(" ")[0]}` : ""}.</h1>
          <p className="sub">
            Your verifiable-audit workspace. One sign-in is a ZeroBias identity — every action is
            attributable, and every attestation is independently verifiable.
          </p>
        </header>

        <section className="ac-grid-cards">
          {/* Identity — from the ZB session */}
          <div className="card glass">
            <div className="c-head">
              <span className="c-ic"><Fingerprint /></span>
              <div>
                <div className="c-title">Your ZeroBias Identity</div>
                <div className="c-sub">Session-inherited · verifiable</div>
              </div>
            </div>
            <div className="id-row">
              <div className="id-avatar">{initials(user?.name)}</div>
              <div>
                <div className="id-name">{user?.name ?? "Loading…"}</div>
                <div className="id-email">{email ?? ""}</div>
              </div>
            </div>
            <div className="kv">
              <div className="kv-row"><span className="k">Organization</span><span className="v">{org?.name ?? "—"}</span></div>
              <div className="kv-row"><span className="k">Identity type</span><span className="v mono">{user ? "ZeroBias · USER" : "—"}</span></div>
            </div>
            <span className="status ok"><span className="ic" /> Authenticated</span>
          </div>

          {/* Backend seam — our own AuditCrowd API validated this ZB identity */}
          <div className="card glass">
            <div className="c-head violet">
              <span className="c-ic"><Server /></span>
              <div>
                <div className="c-title">AuditCrowd Backend</div>
                <div className="c-sub">Customer-owned · ZB-identity front door</div>
              </div>
            </div>
            {seamState === "loading" && <p className="muted">Contacting AuditCrowd API…</p>}
            {seamState === "ok" && (
              <>
                <p className="muted">
                  Our backend independently verified your ZeroBias identity and resolved you as{" "}
                  <strong style={{ color: "#fff" }}>{seam?.zb_user?.name ?? "you"}</strong>.
                </p>
                <div className="kv">
                  <div className="kv-row"><span className="k">Service</span><span className="v mono">{seam?.backend ?? "auditcrowd-api"}</span></div>
                  <div className="kv-row"><span className="k">Resolved via</span><span className="v">ZeroBias /dana/me</span></div>
                </div>
                <span className="status ok"><span className="ic" /> Seam verified</span>
              </>
            )}
            {seamState === "down" && (
              <>
                <p className="muted">The AuditCrowd API isn’t reachable from here right now.</p>
                <span className="status warn"><span className="ic" /> Backend offline</span>
              </>
            )}
          </div>

          {/* Verifiability stat */}
          <div className="card glass">
            <div className="c-head">
              <span className="c-ic"><BadgeCheck /></span>
              <div>
                <div className="c-title">Attestations</div>
                <div className="c-sub">Signed · client-side verifiable</div>
              </div>
            </div>
            <div className="stat"><span className="n">{counts?.history ?? 0}</span><span className="l">completed & attested</span></div>
            <div className="kv">
              <div className="kv-row"><span className="k">Signature</span><span className="v mono">Ed25519</span></div>
              <div className="kv-row"><span className="k">Provenance</span><span className="v">PROV-O · ODRL</span></div>
            </div>
          </div>

          {/* Active engagements */}
          <div className="card glass col-6">
            <div className="c-head">
              <span className="c-ic"><Layers /></span>
              <div>
                <div className="c-title">Active Engagements</div>
                <div className="c-sub">{counts?.engagements ?? 0} in progress</div>
              </div>
            </div>
            <div className="rows">
              {(summary?.engagements ?? []).slice(0, 5).map((e) => (
                <div className="row-item" key={e.id}>
                  <div className="r-main">
                    <div className="r-title">{e.name}</div>
                    <div className="r-meta">{e.org} · boundary {e.boundary}</div>
                  </div>
                  <span className={`tag ${e.live ? "live" : ""}`}>{e.live ? "live" : e.status.replace("_", " ")}</span>
                </div>
              ))}
              {(!summary?.engagements || summary.engagements.length === 0) && (
                <p className="empty">No active engagements yet.</p>
              )}
            </div>
          </div>

          {/* Open opportunities */}
          <div className="card glass col-6">
            <div className="c-head magenta">
              <span className="c-ic"><ShieldCheck /></span>
              <div>
                <div className="c-title">Open Opportunities</div>
                <div className="c-sub">{counts?.opportunities ?? 0} available to claim</div>
              </div>
            </div>
            <div className="rows">
              {(summary?.opportunities ?? []).slice(0, 5).map((o) => (
                <div className="row-item" key={o.id}>
                  <div className="r-main">
                    <div className="r-title">{o.title}</div>
                    <div className="r-meta">{(o.frameworks ?? []).join(" · ") || "assessment"}</div>
                  </div>
                  <button className="btn btn-neon" style={{ padding: "7px 16px", fontSize: 12.5 }}>Claim</button>
                </div>
              ))}
              {(!summary?.opportunities || summary.opportunities.length === 0) && (
                <p className="empty">No open opportunities right now.</p>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
