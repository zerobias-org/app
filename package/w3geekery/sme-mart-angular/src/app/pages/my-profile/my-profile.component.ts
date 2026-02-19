import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatTabsModule],
  template: `
    <h2>My Profile</h2>
    <nav mat-tab-nav-bar [tabPanel]="tabPanel">
      <a mat-tab-link routerLink="overview" routerLinkActive #rla1="routerLinkActive" [active]="rla1.isActive">Overview</a>
      <a mat-tab-link routerLink="expertise" routerLinkActive #rla2="routerLinkActive" [active]="rla2.isActive">Expertise</a>
      <a mat-tab-link routerLink="services" routerLinkActive #rla3="routerLinkActive" [active]="rla3.isActive">Services</a>
      <a mat-tab-link routerLink="reviews" routerLinkActive #rla4="routerLinkActive" [active]="rla4.isActive">Reviews</a>
      <a mat-tab-link routerLink="moderate-reviews" routerLinkActive #rla5="routerLinkActive" [active]="rla5.isActive">Moderate</a>
    </nav>
    <mat-tab-nav-panel #tabPanel>
      <router-outlet />
    </mat-tab-nav-panel>
  `,
  styles: [`
    h2 { font-size: 1.5rem; font-weight: 600; margin: 0 0 1rem; }
    mat-tab-nav-panel { padding-top: 1.5rem; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyProfile {}
