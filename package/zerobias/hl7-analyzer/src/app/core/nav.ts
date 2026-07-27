/**
 * The sidebar rail. Two tools, one landing page — the app does exactly two things, and the nav says
 * so rather than dressing them up as a suite.
 */
export interface NavItem {
  readonly label: string;
  readonly path: string;
  /** Material Symbols ligature name. */
  readonly icon: string;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Overview', path: '/', icon: 'home' },
  { label: 'Messages', path: '/messages', icon: 'search' },
  { label: 'Channels', path: '/channels', icon: 'compare_arrows' },
];
