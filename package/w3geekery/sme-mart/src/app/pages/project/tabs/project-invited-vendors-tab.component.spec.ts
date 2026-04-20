import '@angular/compiler';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { RfpInvitation } from '../../../core/models';
import { ProjectInvitedVendorsTabComponent } from './project-invited-vendors-tab.component';
import { ProjectContextService } from '../../../core/services/project-context.service';
import { RfpInvitationService } from '../../../core/services/rfp-invitation.service';
import { of } from 'rxjs';

describe('ProjectInvitedVendorsTabComponent', () => {
  let component: ProjectInvitedVendorsTabComponent;
  let fixture: ComponentFixture<ProjectInvitedVendorsTabComponent>;
  let mockProjectContext: any;
  let mockInvitationService: any;

  beforeEach(async () => {
    mockProjectContext = {
      projectId: vi.fn().mockReturnValue('proj-123'),
    };

    mockInvitationService = {
      getInvitationsByProject: vi.fn().mockResolvedValue([]),
      sendInvitation: vi.fn().mockResolvedValue({}),
    };

    await TestBed.configureTestingModule({
      imports: [ProjectInvitedVendorsTabComponent],
      providers: [
        { provide: ProjectContextService, useValue: mockProjectContext },
        { provide: RfpInvitationService, useValue: mockInvitationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectInvitedVendorsTabComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize invitations signal as empty array', () => {
    expect(component.invitations()).toEqual([]);
  });

  it('should initialize newVendorOrgId signal as empty string', () => {
    expect(component.newVendorOrgId()).toBe('');
  });

  it('should initialize invitationMessage signal as empty string', () => {
    expect(component.invitationMessage()).toBe('');
  });

  it('should initialize sendingInvite signal as false', () => {
    expect(component.sendingInvite()).toBe(false);
  });

  it('should return correct CSS class for status badges', () => {
    expect(component.getStatusChipClass('pending')).toBe('status-pending');
    expect(component.getStatusChipClass('accepted')).toBe('status-accepted');
    expect(component.getStatusChipClass('declined')).toBe('status-declined');
    expect(component.getStatusChipClass('revoked')).toBe('status-revoked');
    expect(component.getStatusChipClass('expired')).toBe('status-expired');
    expect(component.getStatusChipClass('requested')).toBe('status-requested');
  });

  it('should display invitations in the list', () => {
    const invitations: RfpInvitation[] = [
      {
        id: 'inv-1',
        status: 'pending',
        projectId: 'proj-1',
        vendorOrgId: 'vendor-1',
        invitedAt: '2026-04-06T00:00:00Z',
      } as RfpInvitation,
      {
        id: 'inv-2',
        status: 'accepted',
        projectId: 'proj-1',
        vendorOrgId: 'vendor-2',
        invitedAt: '2026-04-06T00:00:00Z',
      } as RfpInvitation,
    ];
    component.invitations.set(invitations);

    expect(component.invitations().length).toBe(2);
    expect(component.invitations()[0].status).toBe('pending');
    expect(component.invitations()[1].status).toBe('accepted');
  });

  it('should handle setting new vendor org ID', () => {
    component.newVendorOrgId.set('vendor-123');
    expect(component.newVendorOrgId()).toBe('vendor-123');
  });

  it('should handle setting invitation message', () => {
    component.invitationMessage.set('Please bid on this RFP');
    expect(component.invitationMessage()).toBe('Please bid on this RFP');
  });

  it('should track sending state', () => {
    expect(component.sendingInvite()).toBe(false);
    component.sendingInvite.set(true);
    expect(component.sendingInvite()).toBe(true);
    component.sendingInvite.set(false);
    expect(component.sendingInvite()).toBe(false);
  });
});
