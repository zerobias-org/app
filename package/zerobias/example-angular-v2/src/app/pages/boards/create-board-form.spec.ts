import { BoardStatus, BoardType } from '@zerobias-com/platform-sdk';

import { fakeToUuid, SAMPLE_UUID, SAMPLE_UUID_2 , uuid } from '../../testing/fake-uuid';
import { buildNewBoard, type CreateBoardInput } from './create-board-form';

describe('buildNewBoard', () => {
  const base: CreateBoardInput = {
    name: 'Q1 Controls Kanban',
    status: String(BoardStatus.Active),
    boardType: String(BoardType.Kanban),
    description: 'Track evidence.',
    projectId: '',
  };

  it('maps the form fields onto NewBoard via the SDK enum constructors', () => {
    const board = buildNewBoard(base, fakeToUuid);
    expect(board.name).toBe('Q1 Controls Kanban');
    expect(String(board.status)).toBe(String(BoardStatus.Active));
    expect(String(board.boardType)).toBe(String(BoardType.Kanban));
    expect(board.description).toBe('Track evidence.');
  });

  it('defaults a blank name to "Untitled board"', () => {
    expect(buildNewBoard({ ...base, name: '  ' }, fakeToUuid).name).toBe('Untitled board');
  });

  it('places the board under the override project (from a project detail)', () => {
    expect(
      uuid(buildNewBoard({ ...base, projectIdOverride: SAMPLE_UUID }, fakeToUuid).projectId),
    ).toBe(uuid(SAMPLE_UUID));
  });

  it('parses a hand-entered projectId, and omits a not-yet-valid one', () => {
    expect(
      uuid(buildNewBoard({ ...base, projectId: String(SAMPLE_UUID_2) }, fakeToUuid).projectId),
    ).toBe(uuid(SAMPLE_UUID_2));
    expect(buildNewBoard({ ...base, projectId: 'nope' }, fakeToUuid).projectId).toBeUndefined();
  });

  it('omits an empty description', () => {
    expect(buildNewBoard({ ...base, description: '' }, fakeToUuid).description).toBeUndefined();
  });
});
