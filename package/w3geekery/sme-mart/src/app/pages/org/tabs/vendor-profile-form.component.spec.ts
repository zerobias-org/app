import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { VendorProfileForm } from './vendor-profile-form.component';

describe('VendorProfileForm', () => {
  let component: VendorProfileForm;
  let fixture: ComponentFixture<VendorProfileForm>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  beforeEach(async () => {
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatDatepickerModule,
        MatNativeDateModule,
        BrowserAnimationsModule,
        VendorProfileForm,
      ],
      providers: [
        FormBuilder,
        { provide: MatSnackBar, useValue: snackBarSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VendorProfileForm);
    component = fixture.componentInstance;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit save event on form submit', () => {
    // Implementation pending — Task 2
  });

  it('should emit close event on cancel', () => {
    // Implementation pending — Task 2
  });

  it('should pre-fill form in edit mode', () => {
    // Implementation pending — Task 2
  });

  it('should validate section-specific required fields', () => {
    // Implementation pending — Task 2
  });

  it('should show renewal notice when editing expired item', () => {
    // Implementation pending — Task 5
  });
});
