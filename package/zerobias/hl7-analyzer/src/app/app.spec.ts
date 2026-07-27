import { NAV_ITEMS } from './core/nav';

// A dependency-free unit test to keep the suite green. Full shell/component tests (with a mocked
// SessionService + ZbThemeService and a matchMedia polyfill) come with the test-strategy step.
describe('NAV_ITEMS', () => {
  it('starts with Home at the root path', () => {
    expect(NAV_ITEMS[0]).toMatchObject({ path: '/', label: 'Home' });
  });

  it('has unique paths', () => {
    const paths = NAV_ITEMS.map((item) => item.path);
    expect(new Set(paths).size).toBe(paths.length);
  });
});
