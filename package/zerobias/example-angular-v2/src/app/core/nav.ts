/**
 * The demo nav registry — one entry per demo, driving the sidebar rail (and later the home cards),
 * mirroring the React app's `src/lib/demos.ts`. Grows as each demo lands (Phase B: products, pkv,
 * projects, boards, tasks; Phase C: the code-reveal write demos).
 */
export interface NavItem {
  readonly label: string;
  readonly path: string;
  /** Material Icons ligature name. */
  readonly icon: string;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Home', path: '/', icon: 'home' },
  { label: 'Products', path: '/products', icon: 'inventory_2' },
  { label: 'Key-Value', path: '/pkv', icon: 'key' },
  { label: 'Projects', path: '/projects', icon: 'account_tree' },
  { label: 'Boards', path: '/boards', icon: 'space_dashboard' },
  { label: 'Tasks', path: '/tasks', icon: 'checklist' },
  { label: 'Module', path: '/module', icon: 'hub' },
];
