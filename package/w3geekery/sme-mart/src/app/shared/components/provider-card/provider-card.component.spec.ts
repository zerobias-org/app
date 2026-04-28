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

// ─────────────────────────────────────────────────────────────────────
// ZB-shaped corporate provider rendering (Plan 26-03 Wave 3)
// ─────────────────────────────────────────────────────────────────────

const ZB_ORG = '57c741cf-a58e-5efc-bf2f-93c4f6cf76ec';

function makeZbProvider(): ProviderDirectoryRow {
  return {
    id: ZB_ORG,
    user_id: null,
    slug: 'zerobias',
    zerobias_user_id: '',
    zerobias_org_id: ZB_ORG,
    display_name: 'ZeroBias',
    headline: 'Cybersecurity & compliance automation',
    about: null,
    avatar_url: 'https://zerobias.com/logo.png',
    hourly_rate: null,
    availability_status: null,
    response_time: null,
    total_jobs_completed: null,
    total_earnings: null,
    rating_average: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    skills: '[]',
    roles: '[]',
    products: '[]',
    frameworks: '[]',
    segments: '[]',
    service_segments: '[]',
    skill_count: null,
    role_count: null,
    service_count: null,
    review_count: null,
  } as ProviderDirectoryRow;
}

describe('ProviderCard — ZB-shaped corporate provider rendering', () => {
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
    component.provider = makeZbProvider();
  });

  it('renders legal_name as display name', () => {
    expect(component.displayName()).toBe('ZeroBias');
  });

  it('renders short_blurb as headline', () => {
    expect(component.headline()).toBe('Cybersecurity & compliance automation');
  });

  it('renders avatar from logo_url', () => {
    expect(component.avatarUrl()).toBe('https://zerobias.com/logo.png');
  });

  it('does not render rating section when rating_average is null', () => {
    component.provider = makeZbProvider();
    expect(component.rating()).toBeNull();
  });

  it('does not render skills section when skills === "[]"', () => {
    component.provider = makeZbProvider();
    expect(component.topSkills()).toEqual([]);
  });

  it('does not crash when total_jobs_completed is null', () => {
    component.provider = makeZbProvider();
    expect(component.jobsCompleted()).toBe(0);
    expect(() => {
      component.jobsCompleted();
    }).not.toThrow();
  });
});
