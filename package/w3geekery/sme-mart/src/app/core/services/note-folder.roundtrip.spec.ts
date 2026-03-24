/**
 * Roundtrip Field Validation Tests for NoteFolder Entity
 *
 * Validates that no fields are lost during Neon → GQL → Neon transformation cycles.
 * Tests hierarchical parent-child relationships.
 */

import { describe, it, expect } from 'vitest';
import { mapNeonToGql, mapGqlToNeon, NOTE_FOLDER_FIELD_MAPPING } from '@/core/field-mappings';
import { NOTE_FOLDER_GQL_FIXTURE } from '@/test-helpers/gql-fixtures';
import type { GqlNoteFolderResponse } from '@/core/gql-types';
import type { NoteFolder } from '@/core/models/note.model';

/**
 * Test factory to create a Neon NoteFolder object with all fields populated
 */
function makeNoteFolder(overrides?: Partial<NoteFolder>): NoteFolder {
  return {
    id: 'folder-001',
    engagement_id: 'eng-001',
    parent_id: null,
    name: 'Assessment Phase',
    description: 'Notes from initial assessment period',
    created_by_zerobias_user_id: 'user-001',
    created_at: '2026-03-18T10:30:00Z',
    updated_at: '2026-03-18T10:30:00Z',
    access_level: 'boundary',
    sort_order: 1,
    color: '#3F51B5',
    ...overrides,
  };
}

describe('INFRA-04: NoteFolder Roundtrip Field Validation', () => {
  describe('Neon → GQL transformation', () => {
    it('should map all Neon NoteFolder fields to GQL camelCase', () => {
      const neonModel = makeNoteFolder();

      const gqlData = mapNeonToGql<GqlNoteFolderResponse>(
        neonModel,
        NOTE_FOLDER_FIELD_MAPPING.neonToGql,
      );

      expect(gqlData.id).toBe('folder-001');
      expect(gqlData.name).toBe('Assessment Phase');
      expect(gqlData.description).toBe('Notes from initial assessment period');
      expect(gqlData.engagementId).toBe('eng-001');
      expect(gqlData.parentId).toBeNull();
      expect(gqlData.createdByZerobiasUserId).toBe('user-001');
      expect(gqlData.accessLevel).toBe('boundary');
      expect(gqlData.sortOrder).toBe(1);
      expect(gqlData.color).toBe('#3F51B5');
      expect(gqlData.createdAt).toBe('2026-03-18T10:30:00Z');
      expect(gqlData.updatedAt).toBe('2026-03-18T10:30:00Z');
    });

    it('should not lose fields in Neon → GQL mapping', () => {
      const neonModel = makeNoteFolder();
      const gqlData = mapNeonToGql<GqlNoteFolderResponse>(
        neonModel,
        NOTE_FOLDER_FIELD_MAPPING.neonToGql,
      );
      const gqlKeys = Object.keys(gqlData);

      const expectedFieldCount = Object.keys(NOTE_FOLDER_FIELD_MAPPING.neonToGql).length;
      expect(gqlKeys.length).toBe(expectedFieldCount);

      expect(gqlData.id).toBeDefined();
      expect(gqlData.name).toBeDefined();
      expect(gqlData.engagementId).toBeDefined();
      expect(gqlData.createdByZerobiasUserId).toBeDefined();
    });

    it('should handle parent-child folder relationships', () => {
      const childFolder = makeNoteFolder({
        id: 'folder-child-001',
        parent_id: 'folder-001',
        name: 'Sub-Assessment',
        sort_order: 2,
      });

      const gqlData = mapNeonToGql<GqlNoteFolderResponse>(
        childFolder,
        NOTE_FOLDER_FIELD_MAPPING.neonToGql,
      );

      expect(gqlData.parentId).toBe('folder-001');
      expect(gqlData.name).toBe('Sub-Assessment');
      expect(gqlData.sortOrder).toBe(2);
    });

    it('should handle null/optional fields correctly', () => {
      const neonModel = makeNoteFolder({
        parent_id: null,
        description: null,
        color: null,
      });

      const gqlData = mapNeonToGql<GqlNoteFolderResponse>(
        neonModel,
        NOTE_FOLDER_FIELD_MAPPING.neonToGql,
      );

      expect(gqlData.parentId).toBeNull();
      expect(gqlData.description).toBeNull();
      expect(gqlData.color).toBeNull();
    });
  });

  describe('GQL → Neon reverse transformation', () => {
    it('should reverse-map all GQL fields back to Neon snake_case', () => {
      const gqlData = NOTE_FOLDER_GQL_FIXTURE;
      const neonModel = mapGqlToNeon<NoteFolder>(gqlData, NOTE_FOLDER_FIELD_MAPPING.gqlToNeon);

      expect(neonModel.id).toBe('folder-001-uuid-assessment-phase');
      expect(neonModel.name).toBe('Assessment Phase');
      expect(neonModel.engagement_id).toBe('eng-001-uuid-hipaa-assessment');
      expect(neonModel.parent_id).toBeNull();
      expect(neonModel.access_level).toBe('boundary');
      expect(neonModel.sort_order).toBe(1);
      expect(neonModel.color).toBe('#3F51B5');
    });

    it('should not lose fields in GQL → Neon mapping', () => {
      const gqlData = NOTE_FOLDER_GQL_FIXTURE;
      const neonModel = mapGqlToNeon<NoteFolder>(gqlData, NOTE_FOLDER_FIELD_MAPPING.gqlToNeon);
      const neonKeys = Object.keys(neonModel);

      const expectedFieldCount = Object.keys(NOTE_FOLDER_FIELD_MAPPING.gqlToNeon).length;
      expect(neonKeys.length).toBe(expectedFieldCount);
    });
  });

  describe('Roundtrip: Neon → GQL → Neon', () => {
    it('should preserve all fields in complete roundtrip cycle', () => {
      const originalNeon = makeNoteFolder({
        id: 'folder-roundtrip-001',
        engagement_id: 'eng-roundtrip-001',
        name: 'Roundtrip Assessment',
        description: 'Test folder for roundtrip',
        sort_order: 3,
        color: '#FF5722',
      });

      const gqlData = mapNeonToGql<GqlNoteFolderResponse>(
        originalNeon,
        NOTE_FOLDER_FIELD_MAPPING.neonToGql,
      );
      const roundtrippedNeon = mapGqlToNeon<NoteFolder>(gqlData, NOTE_FOLDER_FIELD_MAPPING.gqlToNeon);

      expect(roundtrippedNeon.id).toBe('folder-roundtrip-001');
      expect(roundtrippedNeon.engagement_id).toBe('eng-roundtrip-001');
      expect(roundtrippedNeon.name).toBe('Roundtrip Assessment');
      expect(roundtrippedNeon.description).toBe('Test folder for roundtrip');
      expect(roundtrippedNeon.sort_order).toBe(3);
      expect(roundtrippedNeon.color).toBe('#FF5722');
    });

    it('should preserve folder hierarchy in roundtrip', () => {
      const parentFolder = makeNoteFolder({
        id: 'parent-folder-001',
        parent_id: null,
        name: 'Parent Folder',
      });

      const parentGql = mapNeonToGql<GqlNoteFolderResponse>(
        parentFolder,
        NOTE_FOLDER_FIELD_MAPPING.neonToGql,
      );
      const parentRoundtrip = mapGqlToNeon<NoteFolder>(parentGql, NOTE_FOLDER_FIELD_MAPPING.gqlToNeon);

      const childFolder = makeNoteFolder({
        id: 'child-folder-001',
        parent_id: 'parent-folder-001',
        name: 'Child Folder',
      });

      const childGql = mapNeonToGql<GqlNoteFolderResponse>(
        childFolder,
        NOTE_FOLDER_FIELD_MAPPING.neonToGql,
      );
      const childRoundtrip = mapGqlToNeon<NoteFolder>(childGql, NOTE_FOLDER_FIELD_MAPPING.gqlToNeon);

      // Verify parent has no parent
      expect(parentRoundtrip.parent_id).toBeNull();
      // Verify child links to parent
      expect(childRoundtrip.parent_id).toBe('parent-folder-001');
    });
  });

  describe('Field count verification', () => {
    it('should have equal forward and reverse mapping sizes', () => {
      const forwardKeys = Object.keys(NOTE_FOLDER_FIELD_MAPPING.neonToGql);
      const reverseKeys = Object.keys(NOTE_FOLDER_FIELD_MAPPING.gqlToNeon);
      expect(forwardKeys.length).toBe(reverseKeys.length);
    });
  });
});
