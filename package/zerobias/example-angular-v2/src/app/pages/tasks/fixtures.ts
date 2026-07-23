/**
 * Obfuscated response fixtures for the task code-reveal write demos (twin of example-nextjs-v2's
 * `src/lib/fixtures.ts` task entries). Realistic shape, invented content — no real tenant data.
 */

/** Mirrors `TaskExtended` — the return of `create` / `get`. */
export const exampleTask = {
  id: '1a2b3c4d-5e6f-4a1b-8c2d-3e4f5a6b7c8d',
  code: 'task-42',
  name: 'Collect SOC 2 access-review evidence',
  type: 'task',
  ownerId: '4d5e6f7a-8b9c-4d1e-2f3a-4b5c6d7e8f90',
  activityId: '6a7b8c9d-0e1f-4a2b-9c3d-4e5f6a7b8c9d',
  boardId: 'd7f2a1c8-3b6e-4c90-a2d5-7e1f0b9c4a63',
  projectId: 'c4e17a0b-2d93-4f61-8a5c-6b0e9d21f7a4',
  status: 'todo',
  priority: { label: 'High', value: 1, ownerId: '4d5e6f7a-8b9c-4d1e-2f3a-4b5c6d7e8f90' },
  rank: '0|hzzzzz:',
  // RACI is first-class: assigned (R), accountable (A), approvers, notified (each a party).
  assigned: { partyType: 'user', principalId: '9f1e2d3c-4b5a-4968-87d6-c5b4a3928170', contactName: 'Jordan Rivera' },
  accountable: { partyType: 'user', principalId: '8e2d1c0b-3a49-4857-9645-b4a392817f6e', contactName: 'Alex Kim' },
  approvers: [{ partyType: 'user', principalId: '7d3c2b1a-2938-4746-8534-a3928170f5d2', contactName: 'Sam Lee' }],
  notified: [{ partyType: 'user', principalId: '6c4b3a29-1827-4635-9423-928170f5d2c1', contactName: 'Robin Fox' }],
  links: [],
  activity: { id: '6a7b8c9d-0e1f-4a2b-9c3d-4e5f6a7b8c9d', name: 'Access Review' },
  board: { id: 'd7f2a1c8-3b6e-4c90-a2d5-7e1f0b9c4a63', name: 'Q1 Controls Kanban' },
  workflow: { id: '5b6c7d8e-9f0a-4b1c-8d2e-3f4a5b6c7d8e', name: 'Software Development Lifecycle' },
  nbComments: 0,
  nbAttachments: 0,
  // Status changes happen through these, not a free-text status. Each is a workflow move.
  nextTransitions: [
    { id: 'aa11bb22-cc33-4d44-8e55-6f7788990011', name: 'Start Progress', status: 'in_progress', fromStatus: ['todo'] },
    { id: 'bb22cc33-dd44-4e55-9f66-7788990011aa', name: 'Block', status: 'blocked', fromStatus: ['todo'] },
  ],
  owner: { id: '4d5e6f7a-8b9c-4d1e-2f3a-4b5c6d7e8f90', name: 'Jordan Rivera' },
  description: 'Pull the Q1 access-review exports and link the control.',
  created: '2026-01-15T18:42:07.000Z',
  updated: '2026-01-15T18:42:07.000Z',
} as const;

/**
 * Mirrors `TaskExtended` — the return of `update`. The `transitionId` you sent has been applied:
 * the workflow moved the task to a new `status` (`in_progress`), `nextTransitions` now reflects the
 * moves available FROM there, and `updated` is bumped.
 */
export const exampleUpdatedTask = {
  ...exampleTask,
  status: 'in_progress',
  nextTransitions: [
    { id: 'cc33dd44-ee55-4f66-8a77-8899001122bb', name: 'Complete', status: 'done', fromStatus: ['in_progress'] },
    { id: 'dd44ee55-ff66-4a77-9b88-99001122bbcc', name: 'Block', status: 'blocked', fromStatus: ['in_progress'] },
  ],
  updated: '2026-02-03T14:09:52.000Z',
} as const;

/** Mirrors `TaskComment` — the return of `addComment` (the comment-composer write demo). */
export const exampleTaskComment = {
  id: '9b2e6f14-1c8a-4d3e-b7a0-5f2c9e14d803',
  taskId: '1a2b3c4d-5e6f-4a1b-8c2d-3e4f5a6b7c8d',
  partyId: '7c1d9e2f-4b6a-4c8d-9e0f-1a2b3c4d5e6f',
  personId: '4d5e6f7a-8b9c-4d1e-2f3a-4b5c6d7e8f90',
  person: {
    id: '4d5e6f7a-8b9c-4d1e-2f3a-4b5c6d7e8f90',
    name: 'Jordan Rivera',
    imageUrl: null,
  },
  commentMarkdown: 'Evidence uploaded — see the linked **control policy**.',
  commentTxt: 'Evidence uploaded — see the linked control policy.',
  created: '2026-01-15T18:42:07.000Z',
  updated: '2026-01-15T18:42:07.000Z',
  attachmentIds: [],
} as const;
