import { Injectable, inject } from '@angular/core';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import { UUID } from '@zerobias-org/types-core-js';

/**
 * Boundary party information from platform API.
 * Typed with proper fields instead of loose index signatures.
 */
export interface BoundaryParty {
  id: string;
  name?: string;
  email?: string;
  partyType?: string;
  created?: string;
  updated?: string;
}

/**
 * Boundary party role information.
 */
export interface BoundaryPartyRole {
  id: string;
  name?: string;
  description?: string;
  permissions?: string[];
}

/**
 * Boundary team information.
 */
export interface BoundaryTeam {
  id: string;
  name?: string;
  description?: string;
  memberCount?: number;
}

/**
 * Service wrapping platform.Boundary APIs for parties, roles, and teams.
 * Provides read-only access to boundary information for display purposes.
 * All boundary CRUD operations (create, update, delete) are out of scope
 * and should be performed in the ZeroBias platform Governance app.
 */
@Injectable({ providedIn: 'root' })
export class BoundaryService {
  private readonly clientApi = inject(ZerobiasClientApi);

  /**
   * List all parties in a boundary.
   *
   * @param boundaryId - UUID of the boundary
   * @returns Array of BoundaryParty objects
   */
  async listBoundaryParties(boundaryId: UUID): Promise<BoundaryParty[]> {
    try {
      const api = this.clientApi.platformClient.getBoundaryApi();
      const result = await api.listBoundaryParties(boundaryId, 1, 100);
      return result.items || [];
    } catch (error) {
      console.error('Failed to list boundary parties for', boundaryId, error);
      return [];
    }
  }

  /**
   * List roles for a specific party within a boundary.
   *
   * @param boundaryId - UUID of the boundary
   * @param partyId - UUID of the party
   * @returns Array of BoundaryPartyRole objects
   */
  async listBoundaryPartyRoles(
    boundaryId: UUID,
    partyId: UUID
  ): Promise<BoundaryPartyRole[]> {
    try {
      const api = this.clientApi.platformClient.getBoundaryApi();
      const result = await api.listBoundaryPartyRoles(boundaryId, partyId, 1, 100);
      return result.items || [];
    } catch (error) {
      console.error(
        'Failed to list boundary party roles for',
        boundaryId,
        partyId,
        error
      );
      return [];
    }
  }

  /**
   * List all teams in a boundary.
   *
   * @param boundaryId - UUID of the boundary
   * @returns Array of BoundaryTeam objects
   */
  async listBoundaryTeams(boundaryId: UUID): Promise<BoundaryTeam[]> {
    try {
      const api = this.clientApi.platformClient.getBoundaryApi();
      const result = await api.listBoundaryTeams(boundaryId, 1, 100);
      return result.items || [];
    } catch (error) {
      console.error('Failed to list boundary teams for', boundaryId, error);
      return [];
    }
  }

  /**
   * Get a boundary by ID.
   * Used for retrieving boundary name and metadata for display.
   * NOTE: FLAG-4 resolution — converts UUID to string for safe comparison.
   *
   * @param boundaryId - UUID of the boundary
   * @returns Boundary object with id and name, or null if not found
   */
  async getBoundary(boundaryId: UUID): Promise<{ id: string; name?: string } | null> {
    try {
      const api = this.clientApi.platformClient.getBoundaryApi();
      const result = await api.getBoundary(boundaryId);
      if (result) {
        return {
          id: result.id?.toString() || boundaryId.toString(),
          name: result.name,
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to get boundary', boundaryId, error);
      return null;
    }
  }
}
