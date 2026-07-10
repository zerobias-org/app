"use client";

import { useState } from "react";
import { CreateSharedSessionKeyBody, SharedSessionKey } from "@zerobias-com/dana-sdk";
import { Duration } from "@zerobias-org/types-core-js";
import { useSession } from "@/context/session-context";
import { toUserMessage } from "@/lib/errors";
import { ButtonLabel } from "@/components/ButtonLabel";

/**
 * `danaClient.getMeApi().createSharedSessionKey(body)` -> `SharedSessionKey`.
 * A shared-session key lets someone else act in YOUR current session until it
 * expires — so treat it like a credential.
 *
 * Two SDK details worth copying:
 *  - `expiration` on the request body is an **ISO-8601 Duration** (`PT<minutes>M`),
 *    not a timestamp — build it with `new Duration("PT60M")`.
 *  - `SharedSessionKey.key` is returned **only here, at creation** (like an API
 *    key's secret). Surface it immediately; it can't be fetched again.
 *
 * Mirrors the portal's "Share Session" dialog.
 */
export function CreateSharedSessionDialog({ onClose }: { onClose: () => void }) {
  const { api } = useSession();
  const [minutes, setMinutes] = useState("60");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<SharedSessionKey | null>(null);
  const [copied, setCopied] = useState(false);

  const copy = (text: string) => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const submit = async () => {
    if (!api) return;
    const mins = parseInt(minutes, 10);
    if (!Number.isFinite(mins) || mins < 1) {
      setError("Expiration must be at least 1 minute.");
      return;
    }
    setError(null);
    setCreating(true);
    try {
      // principalId omitted -> defaults to the current user; expiration is a Duration.
      const body = new CreateSharedSessionKeyBody(undefined, new Duration(`PT${mins}M`));
      const shared = await api.danaClient.getMeApi().createSharedSessionKey(body);
      setCreated(shared);
      copy(shared.key);
    } catch (err) {
      console.error("Failed to create shared session key", err);
      setError(toUserMessage(err));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{created ? "Shared Session Key" : "Share Session"}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {created ? (
          <div>
            <p className="subtitle">
              Copy the key now — it won&apos;t be shown again. It has also been
              copied to your clipboard. Expires{" "}
              {created.expiration.toString()}.
            </p>

            <div className="field">
              <label htmlFor="shared-key">Session Key</label>
              <div className="copy-field">
                <input id="shared-key" value={created.key} readOnly />
                <button
                  type="button"
                  className="copy-btn"
                  onClick={() => copy(created.key)}
                  aria-label="Copy session key"
                >
                  <span className="material-symbols-outlined">content_copy</span>
                </button>
              </div>
              {copied && <span className="copied">Copied</span>}
            </div>

            <button className="btn" onClick={onClose}>
              Close
            </button>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
          >
            <p className="subtitle">
              Creates a temporary key that lets someone act in your current
              session until it expires. Anyone with the key inherits your access
              — share it carefully.
            </p>

            <div className="field">
              <label htmlFor="share-minutes">Expires in (minutes)</label>
              <input
                id="share-minutes"
                type="number"
                min={1}
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                autoComplete="off"
                autoFocus
              />
            </div>

            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <button className="btn" disabled={creating}>
              <ButtonLabel label="Create" loading={creating} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
