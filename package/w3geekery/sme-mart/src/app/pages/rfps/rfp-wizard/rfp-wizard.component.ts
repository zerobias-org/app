import {
  Component, inject, OnInit, ViewChild, signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatStepperModule, MatStepper } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RfpWizardService } from '../../../core/services/rfp-wizard.service';
import { RfpStepBasics } from './steps/rfp-step-basics.component';
import { RfpStepDocuments } from './steps/rfp-step-documents.component';
import { RfpStepRequirements } from './steps/rfp-step-requirements.component';
import { RfpStepTerms } from './steps/rfp-step-terms.component';
import { RfpStepReview } from './steps/rfp-step-review.component';
import { RfpMethodChooser } from './steps/rfp-method-chooser.component';

export type RfpCreationMethod = 'manual' | 'ai';

@Component({
  selector: 'app-rfp-wizard',
  standalone: true,
  imports: [
    MatStepperModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    RfpStepBasics,
    RfpStepDocuments,
    RfpStepRequirements,
    RfpStepTerms,
    RfpStepReview,
    RfpMethodChooser,
  ],
  templateUrl: './rfp-wizard.component.html',
  styleUrl: './rfp-wizard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RfpWizard implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  readonly wizard = inject(RfpWizardService);

  @ViewChild('stepper') stepper!: MatStepper;

  readonly loading = signal(true);

  /** null = show method chooser, 'manual'|'ai' = show wizard */
  readonly creationMethod = signal<RfpCreationMethod | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      // Resuming a draft — skip method chooser
      this.creationMethod.set('manual');
      this.wizard.loadDraft(id)
        .then(() => {
          this.loading.set(false);
          // Jump to last completed step
          setTimeout(() => {
            const step = this.wizard.currentStep();
            if (step > 0 && this.stepper) {
              this.stepper.selectedIndex = Math.min(step, 4);
            }
          });
        })
        .catch((err: Error) => {
          this.snackBar.open(`Failed to load draft: ${err.message}`, 'Dismiss', { duration: 5000 });
          this.router.navigate(['/rfps']);
        });
    } else {
      this.wizard.reset();
      this.loading.set(false);
    }
  }

  onMethodChosen(method: RfpCreationMethod): void {
    this.creationMethod.set(method);
  }

  async onBasicsSaved(): Promise<void> {
    this.stepper.next();
  }

  async onDocumentsSaved(): Promise<void> {
    await this.wizard.saveDocuments();
    this.stepper.next();
  }

  async onRequirementsSaved(): Promise<void> {
    await this.wizard.saveRequirements();
    this.stepper.next();
  }

  async onTermsSaved(): Promise<void> {
    await this.wizard.saveTerms();
    this.stepper.next();
  }

  async onPublish(): Promise<void> {
    try {
      await this.wizard.publishRfp();
      this.snackBar.open('RFP published!', 'OK', { duration: 3000 });
      const id = this.wizard.draftId();
      this.router.navigate(['/rfps', id]);
    } catch (err: any) {
      this.snackBar.open(`Publish failed: ${err.message}`, 'Dismiss', { duration: 5000 });
    }
  }

  onSaveDraft(): void {
    const id = this.wizard.draftId();
    if (id) {
      this.snackBar.open('Draft saved', 'OK', { duration: 2000 });
      this.router.navigate(['/rfps', id]);
    }
  }
}
