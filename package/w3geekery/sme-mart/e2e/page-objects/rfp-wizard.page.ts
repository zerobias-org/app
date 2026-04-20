import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * RFP wizard page (/rfps/new).
 *
 * Flow: lands on a method chooser (app-rfp-method-chooser) first; after
 * selecting a method (AI-extract or step-by-step), the 5-step mat-stepper
 * renders (Basics, Documents, Requirements, Terms, Review).
 *
 * See `.claude/smoke-tests/rfp-wizard-create.md` for the full manual flow.
 *
 * This page object covers smoke-level checks: navigate to wizard, verify
 * heading + method chooser render. The full form fill / submit flow is
 * documented in the .md — out of scope for automated regression
 * (autocomplete + multi-step forms are fragile).
 */
export const WIZARD_STEP_LABELS = ['Basics', 'Documents', 'Requirements', 'Terms', 'Review'];

export class RfpWizardPage extends BasePage {
  readonly heading: Locator;
  readonly subtitle: Locator;
  readonly methodChooser: Locator;
  readonly methodChooserHeading: Locator;
  readonly stepper: Locator;
  readonly stepLabels: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: /^Create RFP$/i });
    this.subtitle = page.locator('.wizard-header .subtitle');
    this.methodChooser = page.locator('app-rfp-method-chooser');
    this.methodChooserHeading = page.getByRole('heading', {
      name: /How would you like to create your RFP/i,
    });
    this.stepper = page.locator('mat-stepper');
    this.stepLabels = page.locator('.mat-step-label, .mdc-tab__text-label');
  }

  async goto(): Promise<void> {
    await super.goto('/rfps/new');
  }

  async waitForLoad(): Promise<void> {
    await this.heading.waitFor({ state: 'visible', timeout: 15_000 });
  }

  async expectLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible();
    // New wizard lands on method chooser for new drafts
    await expect(this.methodChooser).toBeVisible();
  }
}
