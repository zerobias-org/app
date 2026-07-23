"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

/**
 * Drawer — an overlay panel scoped to the content region beside the sidebar rail, the React
 * counterpart of Angular Material's `mat-drawer` in `mode="over"` but WITHOUT a backdrop scrim. It
 * slides in from the right of `.app-shell` (the whole area minus the 220px nav — NOT the centered
 * `main.content` column), covering 90% of that region so the code reveal has room to spread on wide
 * screens; the rest of the content stays visible and interactive. Used as the container for the
 * code-reveal create/edit forms (see docs/write-demos.md).
 *
 * The slide uses a mount-on-open enter/exit pattern: the panel is mounted off-screen
 * (translateX(100%)) and only after the browser has painted that frame is the `.open` class added,
 * so the transition always animates from a committed off-screen state into place (and reverses on
 * close before unmount). An always-mounted, off-screen, clipped panel drops its composited layer
 * and the browser skips/garbles the first slide — mounting per-open avoids that entirely.
 */

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Matches the CSS transition duration in _drawer.scss.
const TRANSITION_MS = 280;

export type DrawerProps = {
  open: boolean;
  onClose: () => void;
  /** Panel title — also the dialog's accessible name. */
  title: string;
  children: ReactNode;
};

export function Drawer({ open, onClose, title, children }: DrawerProps) {
  // Gate the portal on a client mount so static-export prerender (and the first hydration render)
  // emit nothing. useSyncExternalStore is the hydration-safe "am I on the client" read.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const [present, setPresent] = useState(false); // in the DOM (stays through the exit slide)
  const [shown, setShown] = useState(false); // has the `.open` class (slid into place)
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  // Enter: mount (present) now, then flip `shown` next frame so the transition runs from the
  // painted off-screen state. Exit: clear `shown` to slide out, then unmount after the transition.
  // setState here lands in a rAF/timeout callback (deferred), not synchronously in the effect body.
  useEffect(() => {
    if (open) {
      let raf2 = 0;
      const raf1 = requestAnimationFrame(() => {
        setPresent(true);
        raf2 = requestAnimationFrame(() => setShown(true));
      });
      return () => {
        cancelAnimationFrame(raf1);
        cancelAnimationFrame(raf2);
      };
    }
    const raf = requestAnimationFrame(() => setShown(false));
    const timer = setTimeout(() => setPresent(false), TRANSITION_MS);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [open]);

  // While open: Escape closes, focus moves into the panel then restores on close.
  useEffect(() => {
    if (!open) return;
    restoreFocusRef.current = document.activeElement as HTMLElement | null;

    const raf = requestAnimationFrame(() => {
      const panel = panelRef.current;
      if (panel) (panel.querySelector<HTMLElement>(FOCUSABLE) ?? panel).focus();
    });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
      restoreFocusRef.current?.focus?.();
    };
  }, [open, onClose]);

  // Trap Tab within the panel.
  const onPanelKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab") return;
    const focusables = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
    if (!focusables || focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  if (!mounted || !present) return null;

  // Scope the drawer to the shell (the region beside the rail), not the centered content column,
  // so it can span the full adjacent width. `.drawer-root` positions itself off the nav's edge.
  const target = document.querySelector<HTMLElement>(".app-shell") ?? document.body;

  return createPortal(
    <div className={`drawer-root${shown ? " open" : ""}`}>
      <div
        className="drawer-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        ref={panelRef}
        onKeyDown={onPanelKeyDown}
      >
        <div className="drawer-header">
          <h2 id={titleId} className="drawer-title">
            {title}
          </h2>
          <button type="button" className="drawer-close" aria-label="Close" onClick={onClose}>
            <span className="material-symbols-outlined" aria-hidden>
              close
            </span>
          </button>
        </div>
        <div className="drawer-body">{children}</div>
      </div>
    </div>,
    target,
  );
}
