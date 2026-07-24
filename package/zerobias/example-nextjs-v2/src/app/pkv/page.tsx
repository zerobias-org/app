"use client";

import { useCallback, useEffect, useState } from "react";
import { Pkv } from "@zerobias-com/dana-sdk";
import { useSession } from "@/context/session-context";
import { toUserMessage } from "@/lib/errors";
import { Spinner } from "@/components/Spinner";
import { TableSkeleton } from "@/components/TableSkeleton";
import { ButtonLabel } from "@/components/ButtonLabel";

/**
 * Canonical read + write against the Principal Key-Value store.
 *   read:  danaClient.getPkvApi().listPrincipalKeyValues()
 *   write: danaClient.getPkvApi().upsertPrincipalKeyValue(new Pkv(key, value))
 *
 * `upsertPrincipalKeyValue` takes `(pkv, principalId?)`.
 * `Pkv.value` is a JSON object map, so the form value must parse to an object.
 */
export default function PkvPage() {
  const { api } = useSession();
  const [pairs, setPairs] = useState<Pkv[]>([]);
  const [loading, setLoading] = useState(true);
  const [key, setKey] = useState("");
  const [value, setValue] = useState('{ "example": true }');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    if (!api) return;
    return api.danaClient
      .getPkvApi()
      .listPrincipalKeyValues(undefined, undefined, 50)
      .then((results) => setPairs(results.items))
      .catch((err) => {
        console.error("Failed to list key-value pairs", err);
        setError(toUserMessage(err));
      })
      .finally(() => setLoading(false));
  }, [api]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async () => {
    if (!api || !key.trim()) return;
    setError(null);

    let parsed: { [k: string]: object };
    try {
      parsed = JSON.parse(value);
    } catch {
      setError("Value must be valid JSON (an object).");
      return;
    }

    setSaving(true);
    try {
      // A plain object literal — the `upsertPrincipalKeyValue(pkv: Pkv)` param types it, so the
      // compiler enforces the model's fields (a missing/misnamed one is a build error).
      await api.danaClient
        .getPkvApi()
        .upsertPrincipalKeyValue({ key: key.trim(), value: parsed });
      setKey("");
      setValue('{ "example": true }');
      await load();
    } catch (err) {
      console.error("Failed to save key-value pair", err);
      setError(toUserMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1>Principal Key-Value</h1>
      <p className="subtitle">
        <code>danaClient.getPkvApi()</code> — list and upsert key-value pairs
        scoped to the current principal.
      </p>

      <form
        className="form-card"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <h2>Add / update a pair</h2>
        <div className="field">
          <label htmlFor="pkv-key">Key</label>
          <input
            id="pkv-key"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="my-setting"
            autoComplete="off"
          />
        </div>
        <div className="field">
          <label htmlFor="pkv-value">Value (JSON object)</label>
          <textarea
            id="pkv-value"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={3}
          />
        </div>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button className="btn" disabled={saving || !key.trim()}>
          <ButtonLabel label="Save pair" loading={saving} />
        </button>
      </form>

      <h2>Stored pairs</h2>
      {loading && (
        <p className="state loading-line">
          <Spinner diameter={18} /> Loading key-value pairs…
        </p>
      )}
      {!loading && pairs.length === 0 ? (
        <p className="state">No key-value pairs yet.</p>
      ) : (
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>Key</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton rows={5} columns={2} />
              ) : (
                pairs.map((p) => (
                  <tr key={p.key}>
                    <td>
                      <code>{p.key}</code>
                    </td>
                    <td>
                      <code>{JSON.stringify(p.value)}</code>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
