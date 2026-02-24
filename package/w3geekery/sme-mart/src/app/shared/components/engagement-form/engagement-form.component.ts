import {
  Component, Input, Output, EventEmitter,
  ChangeDetectionStrategy, inject, signal, OnInit,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CategoriesService } from '../../../core/services/categories.service';
import type { WorkRequest, BudgetType, Category } from '../../../core/models';

export interface EngagementFormValues {
  title: string;
  description: string;
  category: string;
  budget_type: BudgetType | null;
  budget_min: string | null;
  budget_max: string | null;
  timeline: string | null;
}

@Component({
  selector: 'app-engagement-form',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  templateUrl: './engagement-form.component.html',
  styleUrl: './engagement-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EngagementForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly categoriesService = inject(CategoriesService);

  readonly categories = signal<Category[]>([]);
  readonly budgetTypes: { value: BudgetType; label: string }[] = [
    { value: 'fixed', label: 'Fixed Price' },
    { value: 'hourly', label: 'Hourly Rate' },
    { value: 'negotiable', label: 'Negotiable' },
  ];

  readonly form = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    category: ['', Validators.required],
    budget_type: [null as BudgetType | null],
    budget_min: [''],
    budget_max: [''],
    timeline: [''],
  });

  @Input()
  set initialValues(values: Partial<WorkRequest> | undefined) {
    if (values) {
      this.form.patchValue({
        title: values.title || '',
        description: values.description || '',
        category: values.category || '',
        budget_type: values.budget_type || null,
        budget_min: values.budget_min || '',
        budget_max: values.budget_max || '',
        timeline: values.timeline || '',
      });
    }
  }

  @Input()
  set disabled(value: boolean) {
    if (value) {
      this.form.disable();
    } else {
      this.form.enable();
    }
  }

  @Output() valuesChange = new EventEmitter<EngagementFormValues>();

  ngOnInit(): void {
    this.categoriesService.loadCategories().then((cats) => {
      this.categories.set(cats.filter(c => !c.parent_id));
    });

    this.form.valueChanges.subscribe(() => {
      if (this.form.valid) {
        this.valuesChange.emit(this.getValues());
      }
    });
  }

  isValid(): boolean {
    return this.form.valid;
  }

  getValues(): EngagementFormValues {
    const v = this.form.getRawValue();
    return {
      title: v.title || '',
      description: v.description || '',
      category: v.category || '',
      budget_type: v.budget_type || null,
      budget_min: v.budget_min || null,
      budget_max: v.budget_max || null,
      timeline: v.timeline || null,
    };
  }
}
