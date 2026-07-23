import { BoardStatus, BoardType } from '@zerobias-com/platform-sdk';

import { buildUpdateBoard, type EditBoardBaseline, type EditForm } from './edit-board-form';

describe('buildUpdateBoard', () => {
  const baseline: EditBoardBaseline = {
    name: 'Original',
    status: String(BoardStatus.Active),
    boardType: String(BoardType.Kanban),
    description: 'Original description.',
  };

  const unchanged: EditForm = {
    name: 'Original',
    status: String(BoardStatus.Active),
    boardType: String(BoardType.Kanban),
    description: 'Original description.',
  };

  it('produces an empty delta when nothing changed', () => {
    expect(definedKeys(buildUpdateBoard(unchanged, baseline))).toEqual([]);
  });

  it('includes only the changed field', () => {
    const delta = buildUpdateBoard({ ...unchanged, boardType: String(BoardType.List) }, baseline);
    expect(definedKeys(delta)).toEqual(['boardType']);
    expect(String(delta.boardType)).toBe(String(BoardType.List));
  });

  it('clears an emptied description with null', () => {
    expect(buildUpdateBoard({ ...unchanged, description: '' }, baseline).description).toBeNull();
  });
});

function definedKeys(delta: object): string[] {
  return Object.entries(delta)
    .filter(([, v]) => v !== undefined)
    .map(([k]) => k);
}
