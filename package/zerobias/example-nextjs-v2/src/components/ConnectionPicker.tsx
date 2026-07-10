"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { listboxKeyAction } from "@/lib/listbox-nav";
import { StatusDot } from "./StatusDot";

export type ConnectionOption = {
  id: string;
  name: string;
  status: string; // raw operational status, e.g. "up" / "down" / "standby"
  usable: boolean;
};

/**
 * Accessible connection picker — a WAI-ARIA collapsible listbox rather than a
 * native `<select>`, because a native `<option>` can only hold plain text and
 * this control shows each connection's status as a `StatusDot` (the ngx-library
 * `zb-resource-status` dot). It mirrors `OrgSwitcher`: the trigger owns
 * `aria-expanded`; opening moves focus into the `role="listbox"`, which tracks
 * the highlighted row via `aria-activedescendant` and routes keys through the
 * shared pure `listboxKeyAction` helper. Click-outside and Escape close it.
 *
 * Non-usable connections (status not up/standby) render `aria-disabled` and
 * can't be selected, but stay visible so their status chip is still legible —
 * more informative than the greyed-out disabled `<option>` this replaces.
 */
export function ConnectionPicker({
  id,
  connections,
  value,
  onChange,
  disabled = false,
}: {
  id?: string;
  connections: ConnectionOption[];
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = connections.find((c) => c.id === value);

  // Close on click outside (mirrors OrgSwitcher / the account menu).
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

  // Focus moves into the listbox once it renders (a DOM side-effect).
  useEffect(() => {
    if (open) listRef.current?.focus();
  }, [open]);

  const openList = () => {
    const current = connections.findIndex((c) => c.id === value);
    setActiveIndex(current >= 0 ? current : 0);
    setOpen(true);
  };

  const pick = (opt: ConnectionOption | undefined) => {
    if (!opt || !opt.usable) return; // disabled / missing row — not selectable
    setOpen(false);
    onChange(opt.id);
  };

  const onTriggerKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      openList();
    }
  };

  const onListKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
    const action = listboxKeyAction(e.key, activeIndex, connections.length);
    if (action.type === "none") return;
    // Arrows/Home/End/Enter/Space act on the list; let Tab move focus naturally.
    if (e.key !== "Tab") e.preventDefault();
    if (action.type === "move") setActiveIndex(action.index);
    else if (action.type === "select") pick(connections[activeIndex]);
    else if (action.type === "close") setOpen(false);
  };

  const optionId = (c: ConnectionOption) => `conn-opt-${c.id}`;
  const activeConn = activeIndex >= 0 ? connections[activeIndex] : undefined;

  return (
    <div className="conn-picker" ref={rootRef}>
      <button
        type="button"
        id={id}
        className="conn-picker-trigger"
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onTriggerKeyDown}
        disabled={disabled || connections.length === 0}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {selected ? (
          <span className="conn-picker-value">
            <StatusDot status={selected.status} />
            <span className="ellipsis">{selected.name}</span>
          </span>
        ) : (
          <span className="conn-picker-placeholder">
            {connections.length === 0 ? "No connections" : "Select a connection"}
          </span>
        )}
        <span className="material-symbols-outlined">
          {open ? "expand_less" : "expand_more"}
        </span>
      </button>
      {open && (
        <ul
          className="conn-picker-list"
          role="listbox"
          tabIndex={-1}
          ref={listRef}
          aria-label="Select a connection"
          aria-activedescendant={activeConn ? optionId(activeConn) : undefined}
          onKeyDown={onListKeyDown}
        >
          {connections.map((c, i) => {
            const isSelected = c.id === value;
            const active = i === activeIndex;
            return (
              <li
                key={c.id}
                id={optionId(c)}
                role="option"
                aria-selected={isSelected}
                aria-disabled={!c.usable}
                className={`conn-picker-item${isSelected ? " selected" : ""}${
                  active ? " active" : ""
                }${c.usable ? "" : " disabled"}`}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => pick(c)}
              >
                <StatusDot status={c.status} />
                <span className="ellipsis">{c.name}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
