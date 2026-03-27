import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ProviderCard } from './provider-card.component';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { ProviderDirectoryRow } from '../../../core/models';

function makeProvider(overrides: Partial<ProviderDirectoryRow> = {}): ProviderDirectoryRow {
  return {
    id: 'prov-001',
    display_name: 'Jane Smith',
    headline: 'SOC 2 Expert',
    avatar_url: null,
    hourly_rate: '175',
    rating_average: '4.85',
    total_jobs_completed: 12,
    availability: 'available',
    skills: JSON.stringify([
      { skill_name: 'SOC 2', zerobias_skill_id: 's1' },
      { skill_name: 'NIST', zerobias_skill_id: 's2' },
      { skill_name: 'ISO 27001', zerobias_skill_id: 's3' },
      { skill_name: 'PCI-DSS', zerobias_skill_id: 's4' },
    ]),
    role_count: 3,
    review_count: 8,
    ...overrides,
  } as ProviderDirectoryRow;
}

describe('ProviderCard', () => {
  let component: ProviderCard;
  let mockRouter: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockRouter = { navigate: vi.fn() };
    TestBed.configureTestingModule({
      imports: [ProviderCard],
      providers: [{ provide: Router, useValue: mockRouter }],
    });
    const fixture = TestBed.createComponent(ProviderCard);
    component = fixture.componentInstance;
    component.provider = makeProvider();
  });

  it('should compute display name', () => {
    expect(component.displayName()).toBe('Jane Smith');
  });

  it('should compute initials from name', () => {
    expect(component.initials()).toBe('JS');
  });

  it('should parse rating as number', () => {
    expect(component.rating()).toBe(4.85);
  });

  it('should return null rating when not set', () => {
    component.provider = makeProvider({ rating_average: undefined });
    expect(component.rating()).toBeNull();
  });

  it('should parse top 3 skills from JSON', () => {
    expect(component.topSkills()).toEqual(['SOC 2', 'NIST', 'ISO 27001']);
  });

  it('should handle null skills gracefully', () => {
    component.provider = makeProvider({ skills: undefined });
    expect(component.topSkills()).toEqual([]);
  });

  it('should navigate to provider detail on click', () => {
    component.navigate();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/providers', 'prov-001']);
  });
});
