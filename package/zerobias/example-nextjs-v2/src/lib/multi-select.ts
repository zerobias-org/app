/**
 * Pure logic for `MultiSelect` — the value math and the trigger label, kept out of the
 * component so it is unit-testable with no DOM (same pattern as `listbox-nav.ts`).
 */

/** Toggle `id` in `selected`, preserving order and appending new ids at the end. */
export function toggleValue(selected: string[], id: string): string[] {
  return selected.includes(id)
    ? selected.filter((v) => v !== id)
    : [...selected, id];
}

/**
 * The index the keyboard should land on when the popover opens: the first selected
 * option, or the top of the list when nothing is selected.
 */
export function initialActiveIndex(
  optionIds: string[],
  selected: string[],
): number {
  const first = optionIds.findIndex((id) => selected.includes(id));
  return first >= 0 ? first : 0;
}

/**
 * Trigger text: the placeholder when empty, the single option's label when exactly one is
 * chosen (falling back to "1 selected" if that label isn't plain text), else "N selected".
 */
export function triggerLabel(
  selected: string[],
  labelOf: (id: string) => string | null,
  placeholder: string,
): string {
  if (selected.length === 0) return placeholder;
  if (selected.length === 1) return labelOf(selected[0]) ?? "1 selected";
  return `${selected.length} selected`;
}
