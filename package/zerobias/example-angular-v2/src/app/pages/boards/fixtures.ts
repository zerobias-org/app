/**
 * Obfuscated response fixtures for the board code-reveal write demos (twin of example-nextjs-v2's
 * `src/lib/fixtures.ts` board entries). Realistic shape, invented content — no real tenant data.
 * Illustrative only; the read demos are the live truth for response shapes.
 */

/** Mirrors `BoardExtended` — the return of `create` / `get`. */
export const exampleBoard = {
  id: 'd7f2a1c8-3b6e-4c90-a2d5-7e1f0b9c4a63',
  name: 'Q1 Controls Kanban',
  type: 'board',
  ownerId: '4d5e6f7a-8b9c-4d1e-2f3a-4b5c6d7e8f90',
  status: 'active',
  boardType: 'kanban',
  isDefault: false,
  owner: { id: '4d5e6f7a-8b9c-4d1e-2f3a-4b5c6d7e8f90', name: 'Jordan Rivera' },
  taskCount: 0,
  projectId: 'c4e17a0b-2d93-4f61-8a5c-6b0e9d21f7a4',
  project: { id: 'c4e17a0b-2d93-4f61-8a5c-6b0e9d21f7a4', name: 'Q1 Evidence Collection' },
  description: 'Track Q1 control evidence through review.',
  created: '2026-01-15T18:42:07.000Z',
  updated: '2026-01-15T18:42:07.000Z',
} as const;

/** Mirrors `BoardExtended` — the return of `update` (echoes the full record, `status` archived). */
export const exampleUpdatedBoard = {
  ...exampleBoard,
  status: 'archived',
  updated: '2026-02-03T14:09:52.000Z',
} as const;
