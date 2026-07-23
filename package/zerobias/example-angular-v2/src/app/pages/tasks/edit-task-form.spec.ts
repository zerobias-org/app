import { fakeToUuid, SAMPLE_UUID, SAMPLE_UUID_2 , uuid } from '../../testing/fake-uuid';
import { buildUpdateTask, type EditForm, type EditTaskBaseline } from './edit-task-form';

/**
 * Tests the two lessons the Edit Task demo teaches: (1) status is a WORKFLOW TRANSITION carried as
 * `transitionId`, never a status string; (2) the write is a DELTA, and party ids can be unassigned
 * with `null`. `buildUpdateTask` is pure.
 */
describe('buildUpdateTask', () => {
  const baseline: EditTaskBaseline = {
    name: 'Collect evidence',
    description: 'Pull the exports.',
    priority: { value: 1 },
    assigned: { principalId: SAMPLE_UUID },
    accountable: { principalId: SAMPLE_UUID_2 },
  };

  const unchanged: EditForm = {
    transitionId: '',
    name: 'Collect evidence',
    description: 'Pull the exports.',
    priority: '1',
    assigned: String(SAMPLE_UUID),
    accountable: String(SAMPLE_UUID_2),
  };

  it('produces an empty delta when nothing changed', () => {
    expect(definedKeys(buildUpdateTask(unchanged, baseline, fakeToUuid))).toEqual([]);
  });

  it('expresses a status change as transitionId — never a status string', () => {
    const delta = buildUpdateTask({ ...unchanged, transitionId: String(SAMPLE_UUID) }, baseline, fakeToUuid);
    expect(uuid(delta.transitionId)).toBe(uuid(SAMPLE_UUID));
    expect(definedKeys(delta)).toEqual(['transitionId']);
    expect('status' in delta).toBe(false);
  });

  it('includes a changed name and priority, ignoring an unchanged priority', () => {
    expect(buildUpdateTask({ ...unchanged, name: 'Renamed' }, baseline, fakeToUuid).name).toBe('Renamed');
    expect(buildUpdateTask({ ...unchanged, priority: '3' }, baseline, fakeToUuid).priority).toBe(3);
    expect(buildUpdateTask({ ...unchanged, priority: '1' }, baseline, fakeToUuid).priority).toBeUndefined();
  });

  it('unassigns a party with null when its id is blanked', () => {
    const delta = buildUpdateTask({ ...unchanged, assigned: '' }, baseline, fakeToUuid);
    expect(delta.assigned).toBeNull();
  });

  it('sets a party to a new valid id, and leaves a mid-typing invalid id unchanged', () => {
    expect(
      uuid(buildUpdateTask({ ...unchanged, assigned: String(SAMPLE_UUID_2) }, baseline, fakeToUuid).assigned),
    ).toBe(uuid(SAMPLE_UUID_2));
    expect(
      buildUpdateTask({ ...unchanged, assigned: 'typing…' }, baseline, fakeToUuid).assigned,
    ).toBeUndefined();
  });
});

/** Keys of the delta actually assigned (a partial payload leaves the rest undefined). */
function definedKeys(delta: object): string[] {
  return Object.entries(delta)
    .filter(([, v]) => v !== undefined)
    .map(([k]) => k);
}
