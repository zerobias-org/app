/**
 * Auth headers for calls to the AuditCrowd backend (`NEXT_PUBLIC_BACKEND_BASE`).
 *
 * The backend's ZB seam is token-agnostic — it forwards whatever credential we send to
 * ZeroBias's `/dana/me` for validation. Two sources, in order:
 *
 *  - Local dev: the API key from `.env.development` (`Authorization: APIKey <key>`).
 *  - Deployed (uat/qa/prod): the signed-in user's OWN ZeroBias session id, which the v2
 *    client keeps in `sessionStorage['dana-session-id']` (`Authorization: Session <id>`).
 *    This is what makes the backend resolve the REAL logged-in user instead of falling
 *    back to its shared service identity.
 *
 * No credential at all (SSR, or storage unavailable) sends no header — the backend then
 * resolves its service identity, exactly as before.
 */
const DANA_SESSION_ID_KEY = "dana-session-id";

export function backendHeaders(): Record<string, string> {
  const key = process.env.NEXT_PUBLIC_API_KEY;
  if (key) return { Authorization: `APIKey ${key}` };
  try {
    const sid = typeof window !== "undefined"
      ? window.sessionStorage.getItem(DANA_SESSION_ID_KEY)
      : null;
    if (sid) return { Authorization: `Session ${sid}` };
  } catch {
    // sessionStorage can throw in sandboxed iframes — treat as "no credential".
  }
  return {};
}
