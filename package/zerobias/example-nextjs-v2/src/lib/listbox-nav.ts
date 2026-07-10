/**
 * Pure keyboard-navigation math for a single-select listbox (WAI-ARIA pattern).
 *
 * The component owns focus, `aria-activedescendant`, and selection; this helper
 * only answers "given a keypress and the current active row, what should happen?"
 * Keeping it pure makes it unit-testable with no DOM. See `OrgSwitcher`.
 */
export type ListboxKeyAction =
  | { type: "move"; index: number }
  | { type: "select" }
  | { type: "close" }
  | { type: "none" };

/**
 * @param key         the `KeyboardEvent.key` value
 * @param activeIndex currently highlighted row, or -1 when none is
 * @param count       number of rows in the list
 */
export function listboxKeyAction(
  key: string,
  activeIndex: number,
  count: number,
): ListboxKeyAction {
  if (count === 0) {
    return key === "Escape" || key === "Tab" ? { type: "close" } : { type: "none" };
  }

  const clamp = (i: number) => Math.max(0, Math.min(count - 1, i));
  const hasActive = activeIndex >= 0 && activeIndex < count;

  switch (key) {
    case "ArrowDown":
      // From "nothing active", ArrowDown enters at the top.
      return { type: "move", index: hasActive ? clamp(activeIndex + 1) : 0 };
    case "ArrowUp":
      // From "nothing active", ArrowUp enters at the bottom.
      return { type: "move", index: hasActive ? clamp(activeIndex - 1) : count - 1 };
    case "Home":
      return { type: "move", index: 0 };
    case "End":
      return { type: "move", index: count - 1 };
    case "Enter":
    case " ":
      return hasActive ? { type: "select" } : { type: "none" };
    case "Escape":
    case "Tab":
      return { type: "close" };
    default:
      return { type: "none" };
  }
}
