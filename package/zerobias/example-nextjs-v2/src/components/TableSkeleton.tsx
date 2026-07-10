/**
 * Skeleton rows for a loading `<table>` — shimmer placeholders that hold the
 * table's shape while data loads, so the layout doesn't jump when rows arrive.
 * Renders as `<tr>`s meant to sit directly inside a `<tbody>`. Pair it with a
 * `<Spinner>` (e.g. in a status line above the table) for the "actively loading"
 * signal; the skeleton is decorative and hidden from assistive tech.
 *
 * `firstColIcon` renders the first cell as a small circle (for tables whose
 * leading column is a logo/avatar, like Products).
 */
export function TableSkeleton({
  rows,
  columns,
  firstColIcon = false,
}: {
  rows: number;
  columns: number;
  firstColIcon?: boolean;
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="skeleton-row" aria-hidden>
          {Array.from({ length: columns }).map((_, c) => (
            <td key={c}>
              {firstColIcon && c === 0 ? (
                <span className="skeleton skeleton-circle" />
              ) : (
                <span className="skeleton skeleton-bar" />
              )}
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
