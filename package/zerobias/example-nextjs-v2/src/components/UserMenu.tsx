"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "@/context/session-context";
import { useTheme } from "@/lib/theme";
import { OrgSwitcher } from "./OrgSwitcher";
import { CreateApiKeyDialog } from "./CreateApiKeyDialog";
import { CreateSharedSessionDialog } from "./CreateSharedSessionDialog";

function initials(name?: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/[\s-]+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "?";
}

/**
 * Account menu in the header. Presentation + local UI state only — it composes the two
 * SDK-backed actions (`OrgSwitcher`, `CreateApiKeyDialog`) and drives the light/dark
 * toggle through `useTheme` (the portal's `ZbThemeService` model — see src/lib/theme.ts).
 */
export function UserMenu() {
  const { user, org, logout } = useSession();
  const { isDark, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="user-menu" ref={ref}>
      <button
        className="user-menu-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <div className="user-menu-summary">
          <span className="u-name">{user?.name}</span>
          <span className="u-org">{org?.name}</span>
        </div>
        <span className="avatar">{initials(user?.name)}</span>
      </button>

      {open && (
        <div className="user-menu-panel" role="menu">
          <div className="user-menu-head">
            <span className="avatar avatar-lg">{initials(user?.name)}</span>
            <div className="u-info">
              <span className="u-name">{user?.name}</span>
              {user?.emails?.[0] && (
                <span className="u-email">{user.emails[0].toString()}</span>
              )}
            </div>
          </div>

          <hr />

          <div className="user-menu-org">
            <label>Organization</label>
            <OrgSwitcher onSwitched={() => setOpen(false)} />
          </div>

          <hr />

          <button
            className="menu-item"
            onClick={() => {
              setShowApiKey(true);
              setOpen(false);
            }}
          >
            <span className="material-symbols-outlined">key</span>
            <span className="menu-item-label">Create New API Key</span>
          </button>

          <button
            className="menu-item"
            onClick={() => {
              setShowShare(true);
              setOpen(false);
            }}
          >
            <span className="material-symbols-outlined">public</span>
            <span className="menu-item-label">Share Session</span>
          </button>

          {/* Matches the portal: leading icon + label are STATIC; only the
              toggle_on/toggle_off switch icon reflects the current theme. */}
          <button className="menu-item" onClick={toggle}>
            <span className="material-symbols-outlined">dark_mode</span>
            <span className="menu-item-label">Dark Theme</span>
            <span className="material-symbols-outlined theme-switch">
              {isDark ? "toggle_on" : "toggle_off"}
            </span>
          </button>

          <hr />

          <button className="menu-item" onClick={logout}>
            <span className="material-symbols-outlined">logout</span>
            <span className="menu-item-label">Sign Out</span>
          </button>
        </div>
      )}

      {showApiKey && (
        <CreateApiKeyDialog onClose={() => setShowApiKey(false)} />
      )}
      {showShare && (
        <CreateSharedSessionDialog onClose={() => setShowShare(false)} />
      )}
    </div>
  );
}
