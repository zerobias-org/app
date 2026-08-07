import { routes } from './app.routes';
import { AppShell } from './layout/app-shell.component';

/**
 * App Routes Integration Tests — verify route structure.
 *
 * The onboarding guard and the /onboarding/* routes were deleted 2026-08-06:
 * onboarding moved to the platform repo, and authentication is enforced upstream
 * of the router by zerobias-client — a failed whoAmI triggers a cross-origin
 * redirect to the branded login page, so an unauthenticated user never reaches
 * the Angular router at all. There is no app-side auth guard to assert on.
 */
describe('App Routes', () => {
  describe('Route Structure Validation', () => {
    it('AppShell is the root authenticated container', () => {
      const appShellRoute = routes.find(r => r.path === '');
      expect(appShellRoute?.path).toBe('');
      expect(appShellRoute?.component).toBe(AppShell);
      expect(appShellRoute?.children).toBeTruthy();
    });

    it('AppShell has no canActivate — auth is enforced by the SDK, not a route guard', () => {
      const appShellRoute = routes.find(r => r.path === '');
      expect(appShellRoute?.canActivate).toBeFalsy();
    });

    it('All child routes are under AppShell', () => {
      const appShellRoute = routes.find(r => r.path === '');
      expect(appShellRoute?.children).toBeTruthy();
      expect(appShellRoute?.children?.length).toBeGreaterThan(5);
    });

    it('Routes array has expected top-level structure', () => {
      expect(routes.length).toBeGreaterThan(0);
      const topLevelRoutes = routes.filter(r => !r.path || r.path === '');
      expect(topLevelRoutes.length).toBeGreaterThan(0);
    });

    it('No /onboarding route remains', () => {
      const appShellRoute = routes.find(r => r.path === '');
      const onboarding = appShellRoute?.children?.find(r => r.path === 'onboarding');
      expect(onboarding).toBeUndefined();
    });
  });

  describe('Projects Route', () => {
    it('/projects route exists', () => {
      const appShellRoute = routes.find(r => r.path === '');
      // /projects route should exist as AppShell child
      const projectsRoute = appShellRoute?.children?.find(r => r.path === 'projects');
      expect(projectsRoute).toBeTruthy();
      // The component assertion was dropped with MyProjectList, deleted in 43bd75ec:
      // Engagement and Project live in platform.Project, surfaced by the Projects App.
    });
  });

  describe('Admin Route', () => {
    it('/admin route exists', () => {
      const appShellRoute = routes.find(r => r.path === '');
      // /admin route should exist as AppShell child
      const adminRoute = appShellRoute?.children?.find(r => r.path === 'admin');
      expect(adminRoute).toBeTruthy();
      // /admin should use lazy-loading via loadChildren
      expect(adminRoute?.loadChildren).toBeTruthy();
    });
  });
});
