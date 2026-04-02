# Director Review — Phase 10: Vendor Profile UI

**Reviewed:** 2026-04-01
**Verdict:** PASS with 3 FLAGs

## Flags (executor should read before starting)

**FLAG-1: Mixed control flow — use `@if` only, not `*ngIf`.**
Task 5 template mixes `*ngIf="expiredItems().length > 0"` with `@if (expiringSoonItems().length > 0)`. SME Mart uses new Angular control flow exclusively. Replace all `*ngIf` with `@if`, all `*ngFor` with `@for`. This applies to all templates in this phase.

**FLAG-2: `item.data` is a string in domain model — needs parsing before template use.**
Task 4 renders `{{ item.data.policyNumber }}` in the template. But `MarketplaceProfileItem.data` is `type: string` (JSON). The `VendorProfileService` parses it on read — verify that the items signal contains parsed data objects, not raw JSON strings. If `data` is still a string by the time it hits the template, add a `getParsedData(item)` helper or parse during `loadItems()`.

**FLAG-3: Form uses `@Input()` decorator — should use `input()` signal function.**
Plan uses `@Input() mode`, `@Input() section`, `@Input() item`. The codebase convention (established in Phase 12's `ProjectPartiesTabComponent`) uses `input.required<T>()` and `input<T>()` signal inputs. Use signal inputs for consistency.

## Notes

- Good: side drawer pattern (not dialog) for CRUD — better for complex forms
- Good: ZbResourceStatusComponent for status chips
- Good: inline delete confirmation (no modal)
- Good: welcome card for empty orgs (D-14)
- Good: "Items Needing Attention" card matches our design for auto-generated renewal prompts
- Minor: renewal card yellow colors work but could align with ngx-library theme tokens later
