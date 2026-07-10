/**
 * In-place spinner — the equivalent of the portal's `mat-spinner`, for showing
 * that a specific piece of data is loading (an org list, a table, a button
 * action) AFTER the page itself is up. The full-page "loading" state uses the
 * branded `<PageLoader>` instead; this is the smaller, local signal.
 *
 * An indeterminate circular spinner: a single arc (~70% gap) rotating via the
 * shared `zb-spin` keyframes. The arc is `currentColor`, so it inherits the
 * surrounding text color (e.g. white inside a primary button) — set `color` in
 * CSS to recolor it. `diameter` matches `mat-spinner`'s API.
 */
export function Spinner({
  diameter = 24,
  className,
  label = "Loading",
}: {
  diameter?: number;
  className?: string;
  label?: string;
}) {
  const stroke = Math.max(2, Math.round(diameter / 10));
  const r = (diameter - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  return (
    <svg
      className={`spinner-svg${className ? ` ${className}` : ""}`}
      width={diameter}
      height={diameter}
      viewBox={`0 0 ${diameter} ${diameter}`}
      role="status"
      aria-label={label}
    >
      <circle
        cx={diameter / 2}
        cy={diameter / 2}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * 0.7}
      />
    </svg>
  );
}
