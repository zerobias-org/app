"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { Org } from "@zerobias-com/dana-sdk";
import { useSession } from "@/context/session-context";
import { listboxKeyAction } from "@/lib/listbox-nav";
import { Spinner } from "@/components/Spinner";

/**
 * List:   `danaClient.getOrgApi().listOrgs(page, size)` -> PagedResults<Org>.
 * Switch: `app.selectOrg(org)` via `useSession().selectOrg`.
 *
 * `listOrgs` has no sort parameter, so the list is sorted by name on the client.
 *
 * Accessibility — a WAI-ARIA collapsible listbox (not a native `<select>`, so it
 * can be styled to match the portal). The trigger owns `aria-expanded`; when open,
 * focus moves into the `role="listbox"`, which tracks the highlighted row with
 * `aria-activedescendant` and routes arrow/Home/End/Enter/Escape through the pure
 * `listboxKeyAction` helper (see src/lib/listbox-nav.ts). Click-outside and Escape
 * both close it. Hover and keyboard share one `activeIndex` so they stay in sync.
 */
export function OrgSwitcher({ onSwitched }: { onSwitched?: () => void }) {
  const { api, org, selectOrg } = useSession();
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!api) return;
    let mounted = true;
    api.danaClient
      .getOrgApi()
      .listOrgs(1, 50)
      .then((page) => {
        if (!mounted) return;
        const sorted = [...page.items].sort((a, b) =>
          a.name.localeCompare(b.name, undefined, {
            numeric: true,
            sensitivity: "base",
          }),
        );
        setOrgs(sorted);
      })
      .catch((err) => console.error("listOrgs failed", err))
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [api]);

  // Close on click outside (mirrors the account menu).
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Focus moves into the listbox once it renders. Focus is a DOM side-effect, so
  // it belongs in an effect; the active row is seeded in `openList` (below) to
  // avoid setting state synchronously inside an effect.
  useEffect(() => {
    if (open) listRef.current?.focus();
  }, [open]);

  const openList = () => {
    const current = orgs.findIndex((o) => o.id.toString() === org?.id.toString());
    setActiveIndex(current >= 0 ? current : 0);
    setOpen(true);
  };

  const pick = async (next: Org) => {
    setOpen(false);
    await selectOrg(next);
    onSwitched?.();
  };

  const onTriggerKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      openList();
    }
  };

  const onListKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
    const action = listboxKeyAction(e.key, activeIndex, orgs.length);
    if (action.type === "none") return;
    // Arrows/Home/End/Enter/Space act on the list; let Tab move focus naturally.
    if (e.key !== "Tab") e.preventDefault();
    if (action.type === "move") setActiveIndex(action.index);
    else if (action.type === "select") void pick(orgs[activeIndex]);
    else if (action.type === "close") setOpen(false);
  };

  const optionId = (o: Org) => `org-opt-${o.id.toString()}`;
  const activeOrg = activeIndex >= 0 ? orgs[activeIndex] : undefined;

  return (
    <div className="org-switch" ref={rootRef}>
      <button
        type="button"
        className="org-switch-trigger"
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onTriggerKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="ellipsis">{org?.name ?? "Select organization"}</span>
        {loading ? (
          <Spinner diameter={16} label="Loading organizations" />
        ) : (
          <span className="material-symbols-outlined">
            {open ? "expand_less" : "expand_more"}
          </span>
        )}
      </button>
      {open && (
        <ul
          className="org-switch-list"
          role="listbox"
          tabIndex={-1}
          ref={listRef}
          aria-label="Select organization"
          aria-activedescendant={activeOrg ? optionId(activeOrg) : undefined}
          onKeyDown={onListKeyDown}
        >
          {loading && orgs.length === 0 && (
            <li className="org-switch-loading" aria-hidden>
              <Spinner diameter={16} /> Loading organizations…
            </li>
          )}
          {orgs.map((o, i) => {
            const selected = o.id.toString() === org?.id.toString();
            const active = i === activeIndex;
            return (
              <li
                key={o.id.toString()}
                id={optionId(o)}
                role="option"
                aria-selected={selected}
                className={`org-switch-item${selected ? " selected" : ""}${
                  active ? " active" : ""
                }`}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => pick(o)}
              >
                {o.name}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
