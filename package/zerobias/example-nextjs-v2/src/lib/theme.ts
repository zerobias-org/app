import { useSyncExternalStore } from "react";

/**
 * Theme controller — a faithful port of the portal's `ZbThemeService`
 * (`@zerobias-org/ngx-library`) so this app themes **identically to the portal**,
 * including when it runs embedded in the portal's iframe.
 *
 * The model (must match the portal exactly):
 *  - Preference is stored in `localStorage` under `zb-theme-preference` as
 *    `"light" | "dark" | "system"`, defaulting to `"system"`.
 *  - Dark mode applies the **`dark-theme` class to `<body>`** (and to `<html>`
 *    via the FOWT-prevention script in `layout.tsx`) and sets
 *    `document.documentElement.style.colorScheme` — so light is the default and
 *    `.dark-theme` is the override (see `_tokens.scss`).
 *  - **Standalone** (top-level window): resolves its own preference and, while
 *    the preference is `"system"`, follows the OS `prefers-color-scheme` setting.
 *  - **Embedded in the portal iframe**: does NOT self-apply on load; it listens
 *    for the portal's `theme_change` `postMessage` and follows the portal's theme.
 *
 * Matching this model is what lets the app's theme stay in lockstep with the
 * portal when embedded — a bespoke toggle would drift.
 */
export type ThemePreference = "light" | "dark" | "system";

const STORAGE_KEY = "zb-theme-preference";
const DARK_THEME_CLASS = "dark-theme";
const THEME_CHANGE_MESSAGE_TYPE = "theme_change";

function systemPrefersDark(): boolean {
  return (
    typeof window !== "undefined" &&
    (window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false)
  );
}

function loadPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    // localStorage unavailable (SSR/prerender, private browsing) — use the default.
  }
  return "system";
}

function applyDarkClass(isDark: boolean): void {
  // Apply to BOTH <html> and <body>. <html> is required: the derived menu tokens
  // (`--zb-menu-bg: var(--zb-background-card)`) are declared on `:root`, so their
  // `var()` resolves against `--zb-background-card` *on html* — putting the dark
  // override only on <body> would leave those frozen at their light values.
  // <body> matches the portal's ZbThemeService + its postMessage handler.
  document.documentElement.classList.toggle(DARK_THEME_CLASS, isDark);
  document.body.classList.toggle(DARK_THEME_CLASS, isDark);
  // Drives native UI (scrollbars, form controls) — the portal does this too.
  document.documentElement.style.colorScheme = isDark ? "dark" : "light";
}

class ThemeController {
  private preference: ThemePreference = loadPreference();
  private readonly listeners = new Set<() => void>();
  private readonly embedded =
    typeof window !== "undefined" && window.self !== window.top;

  constructor() {
    if (typeof window === "undefined") return;
    // A child app in the portal iframe follows the portal's theme messages.
    window.addEventListener("message", this.onMessage);
    if (!this.embedded) {
      this.apply();
      window
        .matchMedia?.("(prefers-color-scheme: dark)")
        .addEventListener?.("change", () => {
          if (this.preference === "system") this.apply();
        });
    }
  }

  isDarkMode(): boolean {
    if (this.preference === "system") return systemPrefersDark();
    return this.preference === "dark";
  }

  getPreference(): ThemePreference {
    return this.preference;
  }

  setPreference(preference: ThemePreference): void {
    this.preference = preference;
    try {
      localStorage.setItem(STORAGE_KEY, preference);
    } catch {
      // localStorage unavailable — apply for this session anyway.
    }
    this.apply();
  }

  /** Two-state flip, matching the portal's user-menu toggle (never sets "system"). */
  toggle(): void {
    this.setPreference(this.isDarkMode() ? "light" : "dark");
  }

  /** Three-state cycle: system -> light -> dark -> system. */
  cycle(): void {
    const next: ThemePreference =
      this.preference === "system"
        ? "light"
        : this.preference === "light"
          ? "dark"
          : "system";
    this.setPreference(next);
  }

  subscribe = (fn: () => void): (() => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  private apply(): void {
    applyDarkClass(this.isDarkMode());
    this.listeners.forEach((fn) => fn());
  }

  private onMessage = (event: MessageEvent) => {
    if (event.data?.type === THEME_CHANGE_MESSAGE_TYPE) {
      applyDarkClass(Boolean(event.data.isDark));
      this.listeners.forEach((fn) => fn());
    }
  };
}

let controller: ThemeController | null = null;
function getController(): ThemeController {
  if (!controller) controller = new ThemeController();
  return controller;
}

/**
 * React binding for the theme controller. Returns the current dark state and a
 * two-state `toggle` (matching the portal user menu). Re-renders on any theme
 * change — including portal-driven changes when embedded.
 */
export function useTheme(): { isDark: boolean; toggle: () => void } {
  const isDark = useSyncExternalStore(
    (cb) => getController().subscribe(cb),
    () => getController().isDarkMode(),
    () => false, // server/prerender snapshot: light (matches the FOWT default)
  );
  return { isDark, toggle: () => getController().toggle() };
}
