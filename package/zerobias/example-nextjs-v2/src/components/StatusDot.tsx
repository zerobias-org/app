import { statusTone } from "@/lib/status-tone";

/**
 * Resource status dot — a React port of ngx-library's `zb-resource-status`
 * component in dot mode (`showDot`, no label). The portal renders a resource's
 * operational status as a small colored circle: a SOLID fill for terminal states
 * and an OUTLINED (hollow) ring for transitional ones like `standby`. This
 * reproduces that, including the solid-vs-outlined distinction — so `up` and
 * `standby` (both green) stay visually distinct, exactly as the portal does.
 *
 * Color-only by design: the status word next to a connection name is wasted
 * space, so the label is exposed on hover (`title`) and to assistive tech
 * (`aria-label`) instead. Colors are ngx-library's `--zb-color-*` tokens.
 *
 * The status -> tone/outlined/label mapping is the pure `statusTone` helper.
 */
export function StatusDot({ status }: { status?: string }) {
  const { tone, outlined, label } = statusTone(status);
  return (
    <span
      className={`status-dot ${tone}${outlined ? " outlined" : ""}`}
      role="img"
      aria-label={`Status: ${label}`}
      title={label}
    />
  );
}
