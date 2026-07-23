import { MembershipPolicy, ProjectStatus, ProjectVisibility } from '@zerobias-com/platform-sdk';

import { fakeToUuid, SAMPLE_UUID , uuid } from '../../testing/fake-uuid';
import {
  buildUpdateProject,
  type EditForm,
  type EditProjectBaseline,
} from './edit-project-form';

/**
 * Tests the edit lesson: an `UpdateProject` is a DELTA — only changed fields are sent. `buildUpdateProject`
 * is pure, so the behaviour is verified without a component.
 */
describe('buildUpdateProject', () => {
  const baseline: EditProjectBaseline = {
    name: 'Original',
    status: String(ProjectStatus.Active),
    visibility: String(ProjectVisibility.Private),
    membershipPolicy: String(MembershipPolicy.Private),
    description: 'Original description.',
    projectTypeId: null,
  };

  /** A form model seeded from the baseline (i.e. "nothing edited yet"). */
  const unchanged: EditForm = {
    name: 'Original',
    status: String(ProjectStatus.Active),
    visibility: String(ProjectVisibility.Private),
    policy: String(MembershipPolicy.Private),
    description: 'Original description.',
    projectTypeId: '',
  };

  it('produces an empty delta when nothing changed', () => {
    const delta = buildUpdateProject(unchanged, baseline, fakeToUuid);
    expect(definedKeys(delta)).toEqual([]);
  });

  it('includes only the field that changed', () => {
    const delta = buildUpdateProject(
      { ...unchanged, status: String(ProjectStatus.Archived) },
      baseline,
      fakeToUuid,
    );
    expect(definedKeys(delta)).toEqual(['status']);
    expect(String(delta.status)).toBe(String(ProjectStatus.Archived));
  });

  it('trims a changed name and ignores a whitespace-only edit', () => {
    expect(buildUpdateProject({ ...unchanged, name: '  New  ' }, baseline, fakeToUuid).name).toBe('New');
    expect(buildUpdateProject({ ...unchanged, name: '   ' }, baseline, fakeToUuid).name).toBeUndefined();
  });

  it('clears an emptied description with null (not undefined)', () => {
    const delta = buildUpdateProject({ ...unchanged, description: '' }, baseline, fakeToUuid);
    expect(delta.description).toBeNull();
  });

  it('leaves an unchanged description out of the delta', () => {
    expect(buildUpdateProject(unchanged, baseline, fakeToUuid).description).toBeUndefined();
  });

  it('sets a changed, valid projectTypeId and ignores a not-yet-valid one', () => {
    expect(
      uuid(
        buildUpdateProject({ ...unchanged, projectTypeId: String(SAMPLE_UUID) }, baseline, fakeToUuid)
          .projectTypeId,
      ),
    ).toBe(uuid(SAMPLE_UUID));
    expect(
      buildUpdateProject({ ...unchanged, projectTypeId: 'typing…' }, baseline, fakeToUuid).projectTypeId,
    ).toBeUndefined();
  });
});

/** The keys of a delta whose value was actually assigned (partial payloads leave the rest undefined). */
function definedKeys(delta: object): string[] {
  return Object.entries(delta)
    .filter(([, v]) => v !== undefined)
    .map(([k]) => k);
}
