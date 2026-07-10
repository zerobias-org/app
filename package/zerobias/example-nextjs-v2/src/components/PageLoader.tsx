import type { ReactNode } from "react";

/**
 * Page preloader — a port of the portal's `.app-loading` bootstrap indicator
 * (zb-ui-lib `components.scss`): the ZeroBias "0" (a slashed zero, in the Mitr
 * brand font) with a cyan bar sweeping across it via the `zerobiasSlide`
 * animation. This is the "the page is loading" state — shown while the app is
 * still connecting, before any data-level UI exists. Once the page is up,
 * individual data loads use the in-place `<Spinner>` instead.
 *
 * The mark itself is decorative (`aria-hidden`); the accessible loading status
 * comes from the wrapper's `role="status"` + the visually-hidden label.
 */
export function PageLoader({
  label,
  hint,
}: {
  label?: string;
  hint?: ReactNode;
}) {
  return (
    <div className="page-loader" role="status" aria-live="polite">
      <span className="app-loading" aria-hidden>
        0
      </span>
      {label ? <p className="page-loader-label">{label}</p> : null}
      {hint ? <p className="gate-hint">{hint}</p> : null}
      <span className="sr-only">{label ?? "Loading page"}</span>
    </div>
  );
}
