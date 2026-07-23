import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ZbSimplePanelComponent } from '@zerobias-org/ngx-library';
import { SessionService } from '../../core/session.service';

/**
 * Home — the landing page. Its job in Phase A is to prove the whole bootstrap works end to end:
 * the ZeroBias v2 client initialized, the session resolved, and `SessionService`'s signals carry a
 * real `user` and `org`. Feature demos (products, pkv, projects/boards/tasks) land in the rail as
 * they're built.
 *
 * The session card is ngx-library's `zb-simple-panel` (not a hand-rolled card) — components and
 * styles come from ngx-library first (see CLAUDE.md).
 */
@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ZbSimplePanelComponent],
  template: `
    <section class="intro">
      <h1>ZeroBias v2 &mdash; Angular reference app</h1>
      <p class="lead">
        Built on <strong>Angular 21</strong> (standalone, zoneless, signals) +
        <code>&#64;zerobias-org/ngx-library</code> + the v2 client. It mirrors
        <code>example-nextjs-v2</code>: the <strong>project &rarr; board &rarr; task</strong>
        surface, read and code-reveal write demos &mdash; built here on the native ZeroBias Angular
        components.
      </p>
    </section>

    <zb-simple-panel title="Your session" mode="header-only" [bodyPad]="true" class="session">
      @if (session.user(); as user) {
        <dl class="session-grid">
          <div>
            <dt>Signed in as</dt>
            <dd>{{ user.name }}</dd>
          </div>
          @if (user.emails.length) {
            <div>
              <dt>Email</dt>
              <dd>{{ user.emails[0] }}</dd>
            </div>
          }
          <div>
            <dt>Organization</dt>
            <dd>{{ session.org()?.name ?? '—' }}</dd>
          </div>
        </dl>
        <p class="hint">
          The client bootstrapped in an <code>APP_INITIALIZER</code> and established this session
          (platform SSO when deployed; an API key via the dev proxy locally). Every SDK call routes
          through <code>SessionService.api()</code>.
        </p>
      } @else {
        <p class="hint">Resolving your session&hellip;</p>
      }
    </zb-simple-panel>
  `,
  styles: `
    :host { display: block; max-width: 900px; }
    .intro h1 { margin: 0 0 var(--zb-spacing-sm); }
    .lead { color: var(--zb-secondary-text); font-size: var(--zb-font-size-lg); line-height: 1.5; }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; color: var(--zb-primary); }
    .session { display: block; margin-top: var(--zb-spacing-lg); }
    .session-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--zb-spacing-md); margin: 0; }
    dt { color: var(--zb-secondary-text); font-size: var(--zb-font-size-sm); }
    dd { margin: 4px 0 0; font-weight: 500; }
    .hint { margin: var(--zb-spacing-md) 0 0; color: var(--zb-secondary-text); font-size: var(--zb-font-size-sm); line-height: 1.5; }
  `,
})
export class Home {
  protected readonly session = inject(SessionService);
}
