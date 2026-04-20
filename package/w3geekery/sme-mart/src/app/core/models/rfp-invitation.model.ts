/**
 * RfpInvitation Model (Wave 1: Invitation Controls - Phase 14 Plan 01)
 *
 * Represents an invitation sent by a buyer to a vendor to bid on an RFP.
 * Status transitions:
 *   - pending: Buyer sent invitation, vendor has not responded
 *   - accepted: Vendor accepted invitation (can bid)
 *   - declined: Vendor declined invitation (cannot bid)
 *   - revoked: Buyer revoked invitation after sending
 *   - expired: Auto-set when RFP closed with pending invitations
 *   - requested: Vendor requested invitation (awaiting buyer approval)
 *
 * Schema class ID: (will be populated after schema reload)
 */

export type RfpInvitationStatus = 'pending' | 'accepted' | 'declined' | 'revoked' | 'expired' | 'requested';

export interface RfpInvitation {
  id: string;
  projectId: string; // SmeMartProject reference (the RFP)
  vendorOrgId: string; // ZeroBias org ID of the vendor being invited
  status: RfpInvitationStatus;
  invitedAt: string; // ISO 8601 timestamp when invitation was sent
  respondedAt?: string | null; // ISO 8601 timestamp when vendor responded (accepted/declined)
  invitationMessage?: string | null; // Optional message from buyer to vendor
  requestReason?: string | null; // Reason vendor provided if status='requested'
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export interface CreateRfpInvitationRequest {
  projectId: string;
  vendorOrgId: string;
  invitationMessage?: string;
}

export interface UpdateRfpInvitationRequest {
  status?: RfpInvitationStatus;
  invitationMessage?: string;
  requestReason?: string;
  respondedAt?: string;
}

export interface RequestInvitationRequest {
  projectId: string;
  vendorOrgId: string;
  requestReason: string;
}
