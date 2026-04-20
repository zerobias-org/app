import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { BidMethodChooser } from './bid-method-chooser.component';

describe('BidMethodChooser', () => {
  let fixture: ComponentFixture<BidMethodChooser>;
  let component: BidMethodChooser;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BidMethodChooser],
    }).compileComponents();

    fixture = TestBed.createComponent(BidMethodChooser);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have no selectedMethod initially', () => {
    expect(component.selectedMethod()).toBeNull();
  });

  describe('selectMethod', () => {
    it('should set selectedMethod to "ai"', () => {
      component.selectMethod('ai');
      expect(component.selectedMethod()).toBe('ai');
    });

    it('should set selectedMethod to "manual"', () => {
      component.selectMethod('manual');
      expect(component.selectedMethod()).toBe('manual');
    });

    it('should switch between methods', () => {
      component.selectMethod('ai');
      expect(component.selectedMethod()).toBe('ai');

      component.selectMethod('manual');
      expect(component.selectedMethod()).toBe('manual');
    });
  });

  describe('confirm', () => {
    it('should emit methodChosen with selected method', () => {
      const spy = vi.fn();
      component.methodChosen.subscribe(spy);

      component.selectMethod('ai');
      component.confirm();

      expect(spy).toHaveBeenCalledWith('ai');
    });

    it('should emit "manual" when manual is selected', () => {
      const spy = vi.fn();
      component.methodChosen.subscribe(spy);

      component.selectMethod('manual');
      component.confirm();

      expect(spy).toHaveBeenCalledWith('manual');
    });

    it('should not emit when no method is selected', () => {
      const spy = vi.fn();
      component.methodChosen.subscribe(spy);

      component.confirm();

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('template rendering', () => {
    it('should show two method cards', () => {
      const cards = fixture.nativeElement.querySelectorAll('.method-card');
      expect(cards.length).toBe(2);
    });

    it('should not show confirm button initially', () => {
      const actions = fixture.nativeElement.querySelector('.chooser-actions');
      expect(actions).toBeNull();
    });

    it('should show confirm button after selecting a method', () => {
      component.selectMethod('ai');
      fixture.detectChanges();

      const actions = fixture.nativeElement.querySelector('.chooser-actions');
      expect(actions).toBeTruthy();
    });

    it('should show ai-note when AI is selected', () => {
      component.selectMethod('ai');
      fixture.detectChanges();

      const note = fixture.nativeElement.querySelector('.ai-note');
      expect(note).toBeTruthy();
    });

    it('should not show ai-note when manual is selected', () => {
      component.selectMethod('manual');
      fixture.detectChanges();

      const note = fixture.nativeElement.querySelector('.ai-note');
      expect(note).toBeNull();
    });
  });
});
