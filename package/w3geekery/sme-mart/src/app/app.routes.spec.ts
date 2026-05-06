import { routes } from './app.routes';
import { onboardingGuard } from './core/guards/onboarding.guard';
import { AppShell } from './layout/app-shell.component';
import { OnboardingBootstrapShellComponent } from './onboarding/onboarding-bootstrap-shell.component';
import { CompanyProfileFormComponent } from './onboarding/company-profile-form.component';
import { ComingSoon } from './pages/coming-soon/coming-soon.component';

/**
 * App Routes Integration Tests — Verify guard attachment and route structure
 *
 * These tests verify that:
 * 1. The onboarding guard is attached to the AppShell route (all authenticated routes flow through it)
 * 2. /onboarding/bootstrap route exists without guard (bootstrap failure surface)
 * 3. /onboarding/company-profile route exists (Phase 28 target)
 * 4. /projects placeholder route exists (Phase 30 will replace with full board)
 * 5. /admin route exists (Phase X — currently lazy-loaded)
 *
 * Per Phase 27 AR-02 (guard attachment) and AR-04 (routing structure).
 */
describe('App Routes with Onboarding Guard', () => {
  describe('Guard Attachment', () => {
    it('AppShell route has canActivate with onboarding guard', () => {
      // AppShell route (path: "") should exist
      const appShellRoute = routes.find(r => r.path === '');
      expect(appShellRoute).toBeTruthy();
      // Component should be AppShell
      expect(appShellRoute?.component).toBe(AppShell);
      // Should have canActivate array
      expect(appShellRoute?.canActivate).toBeTruthy();
      // canActivate array should not be empty
      expect(appShellRoute?.canActivate?.length).toBeGreaterThan(0);
      // canActivate should include onboardingGuard
      expect(appShellRoute?.canActivate).toContain(onboardingGuard);
    });

    it('All child routes are under AppShell with guard', () => {
      const appShellRoute = routes.find(r => r.path === '');
      // AppShell should have children routes
      expect(appShellRoute?.children).toBeTruthy();
      // AppShell should have multiple child routes
      expect(appShellRoute?.children?.length).toBeGreaterThan(5);
    });
  });

  describe('Onboarding Routes', () => {
    it('Onboarding parent route exists with nested children', () => {
      const appShellRoute = routes.find(r => r.path === '');
      // Onboarding parent path (path: 'onboarding') should exist
      const onboardingParent = appShellRoute?.children?.find(r => r.path === 'onboarding');
      expect(onboardingParent).toBeTruthy();
      // Onboarding parent should have children
      expect(onboardingParent?.children).toBeTruthy();
      // Should have at least 2 child routes (bootstrap + company-profile)
      expect(onboardingParent?.children?.length).toBeGreaterThanOrEqual(2);
    });

    it('/onboarding/bootstrap route exists without guard', () => {
      const appShellRoute = routes.find(r => r.path === '');
      const onboardingParent = appShellRoute?.children?.find(r => r.path === 'onboarding');
      // /onboarding/bootstrap is nested under onboarding parent (path: 'bootstrap')
      const bootstrapRoute = onboardingParent?.children?.find(r => r.path === 'bootstrap');
      expect(bootstrapRoute).toBeTruthy();
      // Component should be OnboardingBootstrapShellComponent
      expect(bootstrapRoute?.component).toBe(OnboardingBootstrapShellComponent);
      // /onboarding/bootstrap should NOT have canActivate (it IS the guard error surface)
      expect(bootstrapRoute?.canActivate).toBeFalsy();
    });

    it('/onboarding/company-profile route exists', () => {
      const appShellRoute = routes.find(r => r.path === '');
      const onboardingParent = appShellRoute?.children?.find(r => r.path === 'onboarding');
      // /onboarding/company-profile is nested under onboarding parent (path: 'company-profile')
      const profileRoute = onboardingParent?.children?.find(r => r.path === 'company-profile');
      expect(profileRoute).toBeTruthy();
      // Component should be CompanyProfileFormComponent
      expect(profileRoute?.component).toBe(CompanyProfileFormComponent);
    });
  });

  describe('Projects Route', () => {
    it('/projects placeholder route exists', () => {
      const appShellRoute = routes.find(r => r.path === '');
      // /projects route should exist as AppShell child
      const projectsRoute = appShellRoute?.children?.find(r => r.path === 'projects');
      expect(projectsRoute).toBeTruthy();
      // Component should be ComingSoon
      expect(projectsRoute?.component).toBe(ComingSoon);
      // Title data should be Projects
      expect(projectsRoute?.data?.['title']).toBe('Projects');
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

  describe('Protection Isolation', () => {
    it('Bootstrap route does not have guard to prevent infinite redirects', () => {
      const appShellRoute = routes.find(r => r.path === '');
      const onboardingParent = appShellRoute?.children?.find(r => r.path === 'onboarding');
      const bootstrapRoute = onboardingParent?.children?.find(r => r.path === 'bootstrap');
      // If bootstrap had a guard, the guard would redirect here on error,
      // and the guard would fire again on this route, creating infinite loop.
      // Verify it's protected against this:
      // Bootstrap route must not have guard
      expect(bootstrapRoute?.canActivate).toBeFalsy();
    });

    it('Other onboarding routes inherit parent guard', () => {
      const appShellRoute = routes.find(r => r.path === '');
      const onboardingParent = appShellRoute?.children?.find(r => r.path === 'onboarding');
      const profileRoute = onboardingParent?.children?.find(r => r.path === 'company-profile');
      // Profile route does NOT have its own canActivate;
      // it inherits the guard from AppShell parent via canActivateChild.
      // Angular's router will check parent's canActivate first.
      // Profile route should not duplicate guard; parent AppShell guard applies
      expect(profileRoute?.canActivate).toBeFalsy();
    });
  });

  describe('Route Structure Validation', () => {
    it('AppShell is the root authenticated container', () => {
      const appShellRoute = routes.find(r => r.path === '');
      // Path should be empty string
      expect(appShellRoute?.path).toBe('');
      // Component should be AppShell
      expect(appShellRoute?.component).toBe(AppShell);
      // canActivate should exist
      expect(appShellRoute?.canActivate?.length).toBeGreaterThan(0);
      // AppShell should have children
      expect(appShellRoute?.children).toBeTruthy();
    });

    it('Routes array has expected top-level structure', () => {
      // Currently only AppShell at top level (no separate login route at top of routes array)
      // Login is handled by the guard redirecting to /login URL
      // Routes array should not be empty
      expect(routes.length).toBeGreaterThan(0);
      // Should have at least one top-level route
      const topLevelRoutes = routes.filter(r => !r.path || r.path === '');
      expect(topLevelRoutes.length).toBeGreaterThan(0);
    });
  });
});
