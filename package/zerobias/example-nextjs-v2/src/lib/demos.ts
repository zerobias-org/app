/**
 * The demo registry — the single source of truth for what this app demonstrates.
 *
 * ONE entry per demo drives BOTH the side navigation (`DemoNav`) and the home page's
 * cards. Adding a Phase-3 demo means adding an object here and creating its route —
 * nothing else. Before this existed, a demo's title/description/call were duplicated
 * between the nav and the home cards, and they drifted.
 *
 * `icon` is a Material Symbols ligature name (the font is already loaded in layout.tsx
 * via `material-symbols/outlined.css`), which is the same icon vocabulary ngx-library's
 * component-showcase uses for its own side nav — so the nav ports 1:1.
 */
export type Demo = {
  /** Route path. Also the nav's active-state key. */
  href: string;
  /** Sidebar label — keep it short; the rail is 220px. */
  label: string;
  /** Material Symbols ligature name, e.g. "inventory_2". */
  icon: string;
  /** Card title on the home page. May be longer than `label`. */
  title: string;
  /** One-line description of what the demo shows. */
  body: string;
  /** The canonical SDK call the demo exists to demonstrate. */
  call: string;
};

export const DEMOS: Demo[] = [
  {
    href: "/products",
    label: "Products",
    icon: "inventory_2",
    title: "Products Catalog",
    body: "Read-only, paginated search of the ZeroBias catalog.",
    call: "portalClient.getProductApi().search()",
  },
  {
    href: "/pkv",
    label: "Key-Value",
    icon: "key",
    title: "Principal Key-Value",
    body: "Read and write per-principal key-value pairs.",
    call: "danaClient.getPkvApi().upsertPrincipalKeyValue()",
  },
  {
    href: "/module",
    label: "Module",
    icon: "extension",
    title: "Module Usage — GitHub",
    body: "Product → module → connection → scope → Hub client; list an org's repos.",
    call: "new GithubHubImpl().connect(HubConnectionProfile)",
  },
  {
    href: "/projects",
    label: "Projects",
    icon: "account_tree",
    title: "Compliance Projects",
    body: "The containment chain — projects hold boards and tasks. Remote table + a detail that drills into the project's own tasks and members.",
    call: "portalClient.getProjectApi().search(body, page, size, sort)",
  },
  {
    href: "/boards",
    label: "Boards",
    icon: "space_dashboard",
    title: "Compliance Boards",
    body: "The middle of the chain — boards sit under a project and hold its tasks. Remote table + a detail that links up to the project and down into the board's tasks.",
    call: "portalClient.getBoardApi().search(body, page, size, sort)",
  },
  {
    href: "/tasks",
    label: "Tasks",
    icon: "checklist",
    title: "Compliance Tasks",
    body: "Search, sort and filter compliance tasks — the remote-table pattern on a real work surface.",
    call: "portalClient.getTaskApi().search(body, page, size, sort)",
  },
];

/** The overview route. Kept out of DEMOS so it renders first in the nav but isn't a demo card. */
export const HOME = { href: "/", label: "Home", icon: "home" } as const;
