import { truncateUuids } from './call-reveal';

/**
 * The code-reveal panels truncate real UUIDs for display so no full identifiers appear on screen.
 */
describe('truncateUuids', () => {
  it('truncates a UUID to its first segment + an ellipsis', () => {
    expect(truncateUuids('id: c4e17a0b-2d93-4f61-8a5c-6b0e9d21f7a4')).toBe('id: c4e17a0b…');
  });

  it('truncates every UUID in the text', () => {
    const text = 'a=c4e17a0b-2d93-4f61-8a5c-6b0e9d21f7a4 b=8f2a1c7d-6b4e-4a90-b1c3-2d5e6f7a8b9c';
    expect(truncateUuids(text)).toBe('a=c4e17a0b… b=8f2a1c7d…');
  });

  it('leaves non-UUID text untouched', () => {
    expect(truncateUuids('const project = new NewProject();')).toBe('const project = new NewProject();');
  });
});
