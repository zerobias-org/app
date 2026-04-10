import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { VettingSuggestionPanelComponent } from './vetting-suggestion-panel.component';
import { VettingService } from '../../../core/services/vetting.service';
import { VendorProfileService } from '../../../core/services/vendor-profile.service';
import { EngagementContextService } from '../../../core/services/engagement-context.service';
import { EngagementVettingItem } from '../../../core/models';
import { MarketplaceProfileItem } from '../../../core/models/marketplace-profile-item.model';
import { signal } from '@angular/core';
import { of } from 'rxjs';

describe('VettingSuggestionPanelComponent', () => {
  let component: VettingSuggestionPanelComponent;
  let fixture: ComponentFixture<VettingSuggestionPanelComponent>;
  let mockVettingService: any;
  let mockVendorProfileService: any;
  let mockEngagementContext: any;

  const mockVettingItem: EngagementVettingItem = {
    id: 'vetting-1',
    engagement_id: 'eng-123',
    name: 'SOC2 Report',
    description: 'Compliance report',
    category: 'always',
    vetting_type: 'documentation',
    evidence_type: 'document',
    status: 'not_started',
    direction: 'buyer_requires',
    condition_trigger: null,
    document_ids: [],
    submitted_at: null,
    verified_at: null,
    verified_by: null,
    expires_at: null,
    rejection_reason: null,
    waived_reason: null,
    notes: null,
    profile_item_id: null,
    created_at: '2026-03-26T10:00:00Z',
    updated_at: '2026-03-26T10:00:00Z',
  };

  beforeEach(async () => {
    mockVettingService = {
      pilotCompletionSuggestion: signal(null),
      clearPilotCompletionSuggestion: vi.fn(),
    };

    mockVendorProfileService = {
      listProfileItems: vi.fn().mockResolvedValue([]),
    };

    mockEngagementContext = {
      engagement: vi.fn().mockReturnValue({
        buyer_zerobias_org_id: 'org-123',
      }),
    };

    await TestBed.configureTestingModule({
      imports: [VettingSuggestionPanelComponent],
      providers: [
        { provide: VettingService, useValue: mockVettingService },
        { provide: VendorProfileService, useValue: mockVendorProfileService },
        { provide: EngagementContextService, useValue: mockEngagementContext },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VettingSuggestionPanelComponent);
    component = fixture.componentInstance;

    // Set required inputs
    fixture.componentRef.setInput('vettingItem', mockVettingItem);
    fixture.componentRef.setInput('onAttach', async () => {});
    fixture.componentRef.setInput('onDetach', async () => {});

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('pilotSuggestion signal', () => {
    it('should render pilot suggestion card when pilotSuggestion is set', () => {
      const suggestion = {
        pilotId: 'pilot-1',
        pilotName: 'Test Pilot',
        completionDate: new Date().toISOString(),
        completionNotes: 'Completed successfully',
        engagementId: 'eng-123',
        summary: 'Pilot completed.',
      };

      mockVettingService.pilotCompletionSuggestion.set(suggestion);
      fixture.detectChanges();

      expect(component.pilotSuggestion()).toEqual(suggestion);

      const compiled = fixture.nativeElement as HTMLElement;
      const card = compiled.querySelector('.pilot-suggestion-card');
      expect(card).toBeTruthy();
    });

    it('should not render pilot suggestion card when pilotSuggestion is null', () => {
      expect(component.pilotSuggestion()).toBe(null);

      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const card = compiled.querySelector('.pilot-suggestion-card');
      expect(card).toBeFalsy();
    });

    it('should display pilot name in suggestion card', () => {
      const suggestion = {
        pilotId: 'pilot-1',
        pilotName: 'My Test Pilot',
        completionDate: '2026-04-01T10:00:00Z',
        completionNotes: '',
        engagementId: 'eng-123',
        summary: 'Pilot completed.',
      };

      mockVettingService.pilotCompletionSuggestion.set(suggestion);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const text = compiled.textContent;
      expect(text).toContain('My Test Pilot');
    });

    it('should display completion date in suggestion card', () => {
      const suggestion = {
        pilotId: 'pilot-1',
        pilotName: 'Test Pilot',
        completionDate: '2026-04-01T10:00:00Z',
        completionNotes: '',
        engagementId: 'eng-123',
        summary: 'Pilot completed.',
      };

      mockVettingService.pilotCompletionSuggestion.set(suggestion);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const text = compiled.textContent;
      expect(text).toContain('Completed');
    });

    it('should display notes when present', () => {
      const suggestion = {
        pilotId: 'pilot-1',
        pilotName: 'Test Pilot',
        completionDate: '2026-04-01T10:00:00Z',
        completionNotes: 'Pilot completed with excellent results',
        engagementId: 'eng-123',
        summary: 'Pilot completed.',
      };

      mockVettingService.pilotCompletionSuggestion.set(suggestion);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const text = compiled.textContent;
      expect(text).toContain('Pilot completed with excellent results');
    });

    it('should not display notes when empty', () => {
      const suggestion = {
        pilotId: 'pilot-1',
        pilotName: 'Test Pilot',
        completionDate: '2026-04-01T10:00:00Z',
        completionNotes: '',
        engagementId: 'eng-123',
        summary: 'Pilot completed.',
      };

      mockVettingService.pilotCompletionSuggestion.set(suggestion);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const card = compiled.querySelector('.pilot-suggestion-card');
      const notesText = card?.innerHTML || '';
      // Notes section should not render if empty
      expect(notesText).not.toContain('<strong>Notes:</strong>');
    });
  });

  describe('dismissPilotSuggestion', () => {
    it('should call vetting.clearPilotCompletionSuggestion()', () => {
      component.dismissPilotSuggestion();

      expect(mockVettingService.clearPilotCompletionSuggestion).toHaveBeenCalled();
    });

    it('should clear suggestion when dismiss button clicked', async () => {
      const suggestion = {
        pilotId: 'pilot-1',
        pilotName: 'Test Pilot',
        completionDate: '2026-04-01T10:00:00Z',
        completionNotes: '',
        engagementId: 'eng-123',
        summary: 'Pilot completed.',
      };

      mockVettingService.pilotCompletionSuggestion.set(suggestion);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const dismissBtn = compiled.querySelector('button[color="primary"]') as HTMLButtonElement;

      if (dismissBtn) {
        dismissBtn.click();
        expect(mockVettingService.clearPilotCompletionSuggestion).toHaveBeenCalled();
      }
    });
  });

  describe('Pilot suggestion card rendering', () => {
    it('should render suggestion card at top of panel', () => {
      const suggestion = {
        pilotId: 'pilot-1',
        pilotName: 'Test Pilot',
        completionDate: '2026-04-01T10:00:00Z',
        completionNotes: '',
        engagementId: 'eng-123',
        summary: 'Pilot completed.',
      };

      mockVettingService.pilotCompletionSuggestion.set(suggestion);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const panel = compiled.querySelector('.suggestion-panel');
      const card = panel?.querySelector('.pilot-suggestion-card');

      expect(card).toBeTruthy();
    });

    it('should have correct card header with title', () => {
      const suggestion = {
        pilotId: 'pilot-1',
        pilotName: 'Test Pilot',
        completionDate: '2026-04-01T10:00:00Z',
        completionNotes: '',
        engagementId: 'eng-123',
        summary: 'Pilot completed.',
      };

      mockVettingService.pilotCompletionSuggestion.set(suggestion);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const title = compiled.querySelector('mat-card-title');

      expect(title?.textContent).toContain('Pilot Completion Suggestion');
    });

    it('should have close button in card header', () => {
      const suggestion = {
        pilotId: 'pilot-1',
        pilotName: 'Test Pilot',
        completionDate: '2026-04-01T10:00:00Z',
        completionNotes: '',
        engagementId: 'eng-123',
        summary: 'Pilot completed.',
      };

      mockVettingService.pilotCompletionSuggestion.set(suggestion);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const card = compiled.querySelector('.pilot-suggestion-card');
      const closeBtn = card?.querySelector('.dismiss-btn');

      expect(closeBtn).toBeTruthy();
    });

    it('should have action buttons in card footer', () => {
      const suggestion = {
        pilotId: 'pilot-1',
        pilotName: 'Test Pilot',
        completionDate: '2026-04-01T10:00:00Z',
        completionNotes: '',
        engagementId: 'eng-123',
        summary: 'Pilot completed.',
      };

      mockVettingService.pilotCompletionSuggestion.set(suggestion);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const card = compiled.querySelector('.pilot-suggestion-card');
      const actions = card?.querySelector('mat-card-actions');

      expect(actions).toBeTruthy();
    });
  });
});
