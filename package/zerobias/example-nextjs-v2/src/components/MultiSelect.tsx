"use client";

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { listboxKeyAction } from "@/lib/listbox-nav";
import {
  toggleValue,
  initialActiveIndex,
  triggerLabel,
} from "@/lib/multi-select";

/**
 * MultiSelect — a checkbox listbox in a popover. The React counterpart of ngx-library's
 * `mat-select` with `multiple` + `mat-checkbox` options (used for column filters and,
 * shortly, task filters/assignees).
 *
 * Reuses the app's popover mechanics from OrgSwitcher: a trigger owning `aria-expanded`,
 * a `role="listbox"` with `aria-activedescendant`, click-outside + Escape to close, and
 * the pure `listboxKeyAction` helper for arrow/Home/End/Enter/Escape. The one difference
 * from the single-select listbox: Enter/Space TOGGLES the active option and keeps the
 * popover open (multi-select), rather than selecting and closing.
 *
 * Controlled: `value` is the array of selected ids; `onChange` gets the next array.
 */

export type MultiSelectOption = {
  id: string;
  label: ReactNode;
};

export type MultiSelectProps = {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  /** Shown on the trigger when nothing is selected. */
  placeholder?: string;
  /** Accessible name for the listbox + trigger. */
  label: string;
  disabled?: boolean;
};

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Any",
  label,
  disabled = false,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = new Set(value);

  // Close on outside click.
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

  // Move keyboard focus into the list when it opens. The effect only touches the DOM;
  // `activeIndex` is set by `openList()` at click time, not synchronously in an effect
  // (react-hooks/set-state-in-effect).
  useEffect(() => {
    if (open) listRef.current?.focus();
  }, [open]);

  const openList = () => {
    setActiveIndex(initialActiveIndex(options.map((o) => o.id), value));
    setOpen(true);
  };

  const toggle = (id: string) => onChange(toggleValue(value, id));

  const onKeyDown = (e: KeyboardEvent) => {
    const action = listboxKeyAction(e.key, activeIndex, options.length);
    switch (action.type) {
      case "move":
        e.preventDefault();
        setActiveIndex(action.index);
        break;
      case "select":
        // Multi-select divergence: toggle and STAY open.
        e.preventDefault();
        if (activeIndex >= 0) toggle(options[activeIndex].id);
        break;
      case "close":
        setOpen(false);
        break;
    }
  };

  const optionDomId = (id: string) => `ms-${label.replace(/\s+/g, "-")}-${id}`;

  const triggerText = triggerLabel(
    value,
    (id) => optionLabelText(options.find((o) => o.id === id)),
    placeholder,
  );

  return (
    <div className="multi-select" ref={rootRef}>
      <button
        type="button"
        className="multi-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openList())}
      >
        <span className="ellipsis">{triggerText}</span>
        <span className="material-symbols-outlined" aria-hidden>
          {open ? "arrow_drop_up" : "arrow_drop_down"}
        </span>
      </button>

      {open && (
        <ul
          className="multi-select-list"
          role="listbox"
          aria-multiselectable="true"
          aria-label={label}
          aria-activedescendant={
            activeIndex >= 0 ? optionDomId(options[activeIndex].id) : undefined
          }
          tabIndex={-1}
          ref={listRef}
          onKeyDown={onKeyDown}
        >
          {options.length === 0 ? (
            <li className="multi-select-empty" aria-hidden>
              No options
            </li>
          ) : (
            options.map((opt, i) => {
              const isSelected = selected.has(opt.id);
              return (
                <li
                  key={opt.id}
                  id={optionDomId(opt.id)}
                  role="option"
                  aria-selected={isSelected}
                  className={`multi-select-item${i === activeIndex ? " active" : ""}`}
                  onClick={() => toggle(opt.id)}
                  onMouseEnter={() => setActiveIndex(i)}
                >
                  <span
                    className={`multi-select-check${isSelected ? " checked" : ""}`}
                    aria-hidden
                  >
                    {isSelected && (
                      <span className="material-symbols-outlined">check</span>
                    )}
                  </span>
                  <span className="multi-select-label">{opt.label}</span>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}

function optionLabelText(opt?: MultiSelectOption): string | null {
  if (!opt) return null;
  return typeof opt.label === "string" ? opt.label : null;
}
