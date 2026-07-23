/**
 * Obfuscated response fixtures for the code-reveal write demos (twin of example-nextjs-v2's
 * `src/lib/fixtures.ts`).
 *
 * These show what a server response LOOKS like without issuing a live call. They are OBFUSCATED:
 * realistic shape, invented content — fake UUIDs, generic names, no real org/task/user data. The
 * read demos (the list tables + detail view) are the live truth for response shapes; these are
 * illustrative only. Never paste a response captured from a real tenant here.
 */

/** Mirrors `ProjectExtended` — the return of `create` / `get`. */
export const exampleProject = {
  id: 'c4e17a0b-2d93-4f61-8a5c-6b0e9d21f7a4',
  name: 'Q1 Evidence Collection',
  type: 'project',
  ownerId: '4d5e6f7a-8b9c-4d1e-2f3a-4b5c6d7e8f90',
  status: 'draft',
  visibility: 'private',
  membershipPolicy: 'private',
  parentId: '8f2a1c7d-6b4e-4a90-b1c3-2d5e6f7a8b9c',
  projectTypeId: '1b9c8d7e-6f5a-4b3c-2d1e-0f9a8b7c6d5e',
  createdBy: '4d5e6f7a-8b9c-4d1e-2f3a-4b5c6d7e8f90',
  owner: { id: '4d5e6f7a-8b9c-4d1e-2f3a-4b5c6d7e8f90', name: 'Jordan Rivera' },
  projectType: { id: '1b9c8d7e-6f5a-4b3c-2d1e-0f9a8b7c6d5e', name: 'Project', type: 'project-type' },
  creator: { id: '4d5e6f7a-8b9c-4d1e-2f3a-4b5c6d7e8f90', name: 'Jordan Rivera' },
  boardCount: 0,
  memberCount: 1,
  description: 'Collect and link Q1 control evidence.',
  created: '2026-01-15T18:42:07.000Z',
  updated: '2026-01-15T18:42:07.000Z',
} as const;

/**
 * Mirrors `ProjectExtended` — the return of `update`. Same shape as a read; the write echoes back
 * the FULL updated record (not just the delta you sent), with the changed fields applied
 * (`status` -> active, `activatedDate` stamped) and `updated` bumped.
 */
export const exampleUpdatedProject = {
  ...exampleProject,
  status: 'active',
  activatedDate: '2026-02-03',
  updated: '2026-02-03T14:09:52.000Z',
} as const;
