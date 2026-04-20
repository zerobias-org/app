import '@angular/compiler';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import type { RfpInvitation } from '../../core/models';
import { MyInvitationsComponent } from './my-invitations.component';
import { RfpInvitationService } from '../../core/services/rfp-invitation.service';
import { ZerobiasClientApi, ZerobiasClientApp } from '@zerobias-com/zerobias-client';

describe('MyInvitationsComponent', () => {
  let component: MyInvitationsComponent;
  let fixture: ComponentFixture<MyInvitationsComponent>;
  let mockInvitationService: any;
  let mockZerobiasClientApi: any;
  let mockZerobiasClientApp: any;

  beforeEach(async () => {
    mockInvitationService = {
      invitations: vi.fn().mockReturnValue([]),
    };

    mockZerobiasClientApi = {
      platformClient: vi.fn().mockReturnValue({}),
      hubClient: vi.fn().mockReturnValue({}),
    };

    mockZerobiasClientApp = {
      zerobiasClientApi: mockZerobiasClientApi,
      getWhoAmI: vi.fn().mockReturnValue(of({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
      })),
    };

    await TestBed.configureTestingModule({
      imports: [MyInvitationsComponent],
      providers: [
        { provide: RfpInvitationService, useValue: mockInvitationService },
        { provide: ZerobiasClientApi, useValue: mockZerobiasClientApi },
        { provide: ZerobiasClientApp, useValue: mockZerobiasClientApp },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MyInvitationsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize invitations signal as empty array', () => {
    expect(component.invitations()).toEqual([]);
  });

  it('should initialize statusFilter as "all"', () => {
    expect(component.statusFilter()).toBe('all');
  });

  it('should filter invitations by pending status', () => {
    const invitations: RfpInvitation[] = [
      { id: 'inv-1', status: 'pending', projectId: 'proj-1', vendorOrgId: 'vendor-1', invitedAt: '2026-04-06T00:00:00Z' } as RfpInvitation,
      { id: 'inv-2', status: 'accepted', projectId: 'proj-2', vendorOrgId: 'vendor-1', invitedAt: '2026-04-06T00:00:00Z' } as RfpInvitation,
    ];
    component.invitations.set(invitations);
    component.statusFilter.set('pending');

    const filtered = component.filteredInvitations();
    expect(filtered.length).toBe(1);
    expect(filtered[0].status).toBe('pending');
  });

  it('should filter invitations by accepted status', () => {
    const invitations: RfpInvitation[] = [
      { id: 'inv-1', status: 'pending', projectId: 'proj-1', vendorOrgId: 'vendor-1', invitedAt: '2026-04-06T00:00:00Z' } as RfpInvitation,
      { id: 'inv-2', status: 'accepted', projectId: 'proj-2', vendorOrgId: 'vendor-1', invitedAt: '2026-04-06T00:00:00Z' } as RfpInvitation,
    ];
    component.invitations.set(invitations);
    component.statusFilter.set('accepted');

    const filtered = component.filteredInvitations();
    expect(filtered.length).toBe(1);
    expect(filtered[0].status).toBe('accepted');
  });

  it('should return all invitations when filter is "all"', () => {
    const invitations: RfpInvitation[] = [
      { id: 'inv-1', status: 'pending', projectId: 'proj-1', vendorOrgId: 'vendor-1', invitedAt: '2026-04-06T00:00:00Z' } as RfpInvitation,
      { id: 'inv-2', status: 'accepted', projectId: 'proj-2', vendorOrgId: 'vendor-1', invitedAt: '2026-04-06T00:00:00Z' } as RfpInvitation,
      { id: 'inv-3', status: 'requested', projectId: 'proj-3', vendorOrgId: 'vendor-1', invitedAt: '2026-04-06T00:00:00Z' } as RfpInvitation,
    ];
    component.invitations.set(invitations);
    component.statusFilter.set('all');

    expect(component.filteredInvitations().length).toBe(3);
  });

  it('should change statusFilter when setStatusFilter is called', () => {
    component.setStatusFilter('pending');
    expect(component.statusFilter()).toBe('pending');

    component.setStatusFilter('accepted');
    expect(component.statusFilter()).toBe('accepted');

    component.setStatusFilter('all');
    expect(component.statusFilter()).toBe('all');
  });

  it('should return correct CSS class for status badges', () => {
    expect(component.getStatusChipClass('pending')).toBe('status-pending');
    expect(component.getStatusChipClass('accepted')).toBe('status-accepted');
    expect(component.getStatusChipClass('declined')).toBe('status-declined');
    expect(component.getStatusChipClass('revoked')).toBe('status-revoked');
    expect(component.getStatusChipClass('expired')).toBe('status-expired');
    expect(component.getStatusChipClass('requested')).toBe('status-requested');
  });
});
