import { MembershipPolicy, ProjectStatus, ProjectVisibility } from '@zerobias-com/platform-sdk';

import { fakeToUuid, SAMPLE_UUID } from '../../testing/fake-uuid';
import { buildNewProject, type CreateProjectInput } from './create-project-form';

/**
 * Tests the SDK-shape lesson the Create Project demo teaches: what `NewProject` a consumer's live
 * input produces. `buildNewProject` is pure, so no component/TestBed is needed.
 */
describe('buildNewProject', () => {
  const base: CreateProjectInput = {
    name: 'Q1 Evidence Collection',
    status: String(ProjectStatus.Active),
    visibility: String(ProjectVisibility.Private),
    policy: String(MembershipPolicy.Private),
    description: 'Collect Q1 evidence.',
    projectTypeId: '',
  };

  it('maps the form fields onto NewProject via the SDK enum constructors', () => {
    const project = buildNewProject(base, fakeToUuid);
    expect(project.name).toBe('Q1 Evidence Collection');
    expect(String(project.status)).toBe(String(ProjectStatus.Active));
    expect(String(project.visibility)).toBe(String(ProjectVisibility.Private));
    expect(String(project.membershipPolicy)).toBe(String(MembershipPolicy.Private));
    expect(project.description).toBe('Collect Q1 evidence.');
  });

  it('defaults a blank name to "Untitled project" and trims whitespace', () => {
    expect(buildNewProject({ ...base, name: '   ' }, fakeToUuid).name).toBe('Untitled project');
    expect(buildNewProject({ ...base, name: '  Padded  ' }, fakeToUuid).name).toBe('Padded');
  });

  it('omits an empty description (undefined, not empty string)', () => {
    expect(buildNewProject({ ...base, description: '   ' }, fakeToUuid).description).toBeUndefined();
  });

  it('sets parentId when creating a sub-project', () => {
    const project = buildNewProject({ ...base, parentId: SAMPLE_UUID }, fakeToUuid);
    // `newInstance` runs the payload through ObjectSerializer, so ids come back as real UUID
    // instances rather than the raw value handed in (the positional constructor did no coercion).
    // Compare by value, not identity.
    expect(String(project.parentId)).toBe(String(SAMPLE_UUID));
  });

  it('parses a valid projectTypeId and omits an invalid one instead of breaking the payload', () => {
    expect(
      String(buildNewProject({ ...base, projectTypeId: String(SAMPLE_UUID) }, fakeToUuid).projectTypeId),
    ).toBe(String(SAMPLE_UUID));
    expect(
      buildNewProject({ ...base, projectTypeId: 'not-a-uuid-yet' }, fakeToUuid).projectTypeId,
    ).toBeUndefined();
  });
});
