import type { ReactNode } from "react";
import { Spinner } from "./Spinner";

/**
 * Button label that swaps to a spinner while an action is in flight — a port of
 * the portal's `zb-ui-button-label` (ZbUiButtonLabelComponent). Drop it in as a
 * `<button>`'s child and drive `loading` from the action's pending state; keep
 * the button's own `disabled={loading}` so the spinner state also blocks repeat
 * clicks — the reason the portal uses this instead of a plain text label.
 *
 * The spinner is `currentColor`, so it inherits the button's text color (white
 * on a filled primary button), matching the label it replaces.
 */
export function ButtonLabel({
  label,
  loading,
  diameter = 20,
}: {
  label: ReactNode;
  loading: boolean;
  diameter?: number;
}) {
  return loading ? (
    <Spinner diameter={diameter} label="Working" />
  ) : (
    <>{label}</>
  );
}
