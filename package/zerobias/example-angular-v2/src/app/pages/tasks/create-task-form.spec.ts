import { fakeToUuid, SAMPLE_UUID, SAMPLE_UUID_2 , uuid } from '../../testing/fake-uuid';
import { buildNewTask, splitUuidList, type CreateTaskInput } from './create-task-form';

const PLACEHOLDER_ACTIVITY = '00000000-0000-0000-0000-000000000000';

const blank: CreateTaskInput = {
  activityId: '',
  name: '',
  description: '',
  priority: '',
  assigned: '',
  accountable: '',
  approvers: '',
  notified: '',
  links: '',
};

describe('splitUuidList', () => {
  it('splits on commas and whitespace, trimming blanks', () => {
    expect(splitUuidList('a, b  c ,,d')).toEqual(['a', 'b', 'c', 'd']);
  });

  it('de-duplicates while preserving first-seen order', () => {
    expect(splitUuidList('a, b, a, c, b')).toEqual(['a', 'b', 'c']);
  });

  it('returns an empty array for blank input', () => {
    expect(splitUuidList('   ')).toEqual([]);
  });
});

describe('buildNewTask', () => {
  it('uses the fake placeholder activity when none is entered (payload always constructs)', () => {
    const task = buildNewTask(blank, fakeToUuid);
    expect(String(task.activityId)).toBe(PLACEHOLDER_ACTIVITY);
  });

  it('uses a valid entered activityId over the placeholder', () => {
    const task = buildNewTask({ ...blank, activityId: String(SAMPLE_UUID) }, fakeToUuid);
    expect(uuid(task.activityId)).toBe(uuid(SAMPLE_UUID));
  });

  it('falls back to the provided activityIdOverride (created from a board activity)', () => {
    const task = buildNewTask({ ...blank, activityIdOverride: SAMPLE_UUID }, fakeToUuid);
    expect(uuid(task.activityId)).toBe(uuid(SAMPLE_UUID));
  });

  it('always includes the three required arrays, de-duplicating party ids', () => {
    const ids = `${SAMPLE_UUID}, ${SAMPLE_UUID_2}, ${SAMPLE_UUID}`;
    const task = buildNewTask({ ...blank, approvers: ids, notified: '', links: '' }, fakeToUuid);
    expect(task.approvers.map(uuid)).toEqual([SAMPLE_UUID, SAMPLE_UUID_2].map(uuid));
    expect(task.notified).toEqual([]);
    expect(task.links).toEqual([]);
  });

  it('wraps each valid link id in a NewTaskLink', () => {
    const task = buildNewTask({ ...blank, links: String(SAMPLE_UUID) }, fakeToUuid);
    expect(task.links).toHaveLength(1);
    expect(uuid(task.links[0].resourceId)).toBe(uuid(SAMPLE_UUID));
  });

  it('sets the optional properties only when provided', () => {
    const task = buildNewTask(
      { ...blank, name: '  Do it  ', description: 'notes', priority: '2', boardId: SAMPLE_UUID_2 },
      fakeToUuid,
    );
    expect(task.name).toBe('Do it');
    expect(task.description).toBe('notes');
    expect(task.priority).toBe(2);
    expect(uuid(task.boardId)).toBe(uuid(SAMPLE_UUID_2));
  });

  it('ignores a non-numeric priority', () => {
    expect(buildNewTask({ ...blank, priority: 'high' }, fakeToUuid).priority).toBeUndefined();
  });
});
