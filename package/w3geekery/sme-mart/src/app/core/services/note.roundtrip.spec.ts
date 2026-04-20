/**
 * Roundtrip Field Validation Tests for Note Entity
 *
 * Validates that no fields are lost during Neon → GQL → Neon transformation cycles.
 */

import { describe, it, expect } from 'vitest';
import { mapNeonToGql, mapGqlToNeon, NOTE_FIELD_MAPPING } from '@/core/field-mappings';
import { NOTE_GQL_FIXTURE } from '@/test-helpers/gql-fixtures';
import type { GqlNoteResponse } from '@/core/gql-types';
import type { Note, NoteAccessLevel } from '@/core/models/note.model';

/**
 * Test factory to create a Neon Note object with all fields populated
 */
function makeNote(overrides?: Partial<Note>): Note {
  return {
    id: 'note-001',
    engagement_id: 'eng-001',
    folder_id: 'folder-001',
    title: 'Initial Assessment',
    body: 'Preliminary findings from kickoff call',
    author_zerobias_user_id: 'user-001',
    created_at: '2026-03-18T10:35:00Z',
    updated_at: '2026-03-18T10:35:00Z',
    updated_by_zerobias_user_id: 'user-001',
    archived: false,
    access_level: 'boundary',
    meeting_date: '2026-03-18T09:00:00Z',
    meeting_duration_minutes: 45,
    backing_task_id: null,
    injected_to_task_id: null,
    injected_comment_id: null,
    injected_at: null,
    is_meeting_minutes: true,
    boundary_id: 'boundary-uuid',
    project_id: null,
    ...overrides,
  };
}

describe('INFRA-04: Note Roundtrip Field Validation', () => {
  describe('Neon → GQL transformation', () => {
    it('should map all Neon Note fields to GQL camelCase', () => {
      const neonModel = makeNote();

      const gqlData = mapNeonToGql<GqlNoteResponse>(neonModel, NOTE_FIELD_MAPPING.neonToGql);

      expect(gqlData.id).toBe('note-001');
      expect(gqlData.title).toBe('Initial Assessment');
      expect(gqlData.body).toBe('Preliminary findings from kickoff call');
      expect(gqlData.engagementId).toBe('eng-001');
      expect(gqlData.folderId).toBe('folder-001');
      expect(gqlData.authorZerobiasUserId).toBe('user-001');
      expect(gqlData.accessLevel).toBe('boundary');
      expect(gqlData.isMeetingMinutes).toBe(true);
      expect(gqlData.meetingDate).toBe('2026-03-18T09:00:00Z');
      expect(gqlData.meetingDurationMinutes).toBe(45);
      expect(gqlData.createdAt).toBe('2026-03-18T10:35:00Z');
      expect(gqlData.updatedAt).toBe('2026-03-18T10:35:00Z');
    });

    it('should not lose fields in Neon → GQL mapping', () => {
      const neonModel = makeNote();
      const gqlData = mapNeonToGql<GqlNoteResponse>(neonModel, NOTE_FIELD_MAPPING.neonToGql);
      const gqlKeys = Object.keys(gqlData);

      const expectedFieldCount = Object.keys(NOTE_FIELD_MAPPING.neonToGql).length;
      expect(gqlKeys.length).toBe(expectedFieldCount);

      expect(gqlData.id).toBeDefined();
      expect(gqlData.title).toBeDefined();
      expect(gqlData.body).toBeDefined();
      expect(gqlData.engagementId).toBeDefined();
      expect(gqlData.accessLevel).toBeDefined();
    });

    it('should handle different access levels', () => {
      const accessLevels: NoteAccessLevel[] = ['personal', 'boundary', 'project'];

      for (const level of accessLevels) {
        const neonModel = makeNote({ access_level: level });
        const gqlData = mapNeonToGql<GqlNoteResponse>(neonModel, NOTE_FIELD_MAPPING.neonToGql);
        expect(gqlData.accessLevel).toBe(level);
      }
    });

    it('should handle null/optional meeting fields', () => {
      const neonModel = makeNote({
        is_meeting_minutes: false,
        meeting_date: null,
        meeting_duration_minutes: null,
        backing_task_id: null,
      });

      const gqlData = mapNeonToGql<GqlNoteResponse>(neonModel, NOTE_FIELD_MAPPING.neonToGql);

      expect(gqlData.isMeetingMinutes).toBe(false);
      expect(gqlData.meetingDate).toBeNull();
      expect(gqlData.meetingDurationMinutes).toBeNull();
      expect(gqlData.backingTaskId).toBeNull();
    });
  });

  describe('GQL → Neon reverse transformation', () => {
    it('should reverse-map all GQL fields back to Neon snake_case', () => {
      const gqlData = NOTE_GQL_FIXTURE;
      const neonModel = mapGqlToNeon<Note>(gqlData, NOTE_FIELD_MAPPING.gqlToNeon);

      expect(neonModel.id).toBe('note-001-uuid-kickoff-call');
      expect(neonModel.title).toBe('Kickoff Call Notes');
      expect(neonModel.engagement_id).toBe('eng-001-uuid-hipaa-assessment');
      expect(neonModel.folder_id).toBe('folder-001-uuid-assessment-phase');
      expect(neonModel.access_level).toBe('boundary');
      expect(neonModel.is_meeting_minutes).toBe(true);
    });

    it('should not lose fields in GQL → Neon mapping', () => {
      const gqlData = NOTE_GQL_FIXTURE;
      const neonModel = mapGqlToNeon<Note>(gqlData, NOTE_FIELD_MAPPING.gqlToNeon);
      const neonKeys = Object.keys(neonModel);

      const expectedFieldCount = Object.keys(NOTE_FIELD_MAPPING.gqlToNeon).length;
      expect(neonKeys.length).toBe(expectedFieldCount);
    });
  });

  describe('Roundtrip: Neon → GQL → Neon', () => {
    it('should preserve all fields in complete roundtrip cycle', () => {
      const originalNeon = makeNote({
        id: 'note-roundtrip-001',
        engagement_id: 'eng-roundtrip-001',
        folder_id: 'folder-roundtrip-001',
        title: 'Assessment Findings',
        body: 'Detailed findings from compliance review',
        access_level: 'boundary',
      });

      const gqlData = mapNeonToGql<GqlNoteResponse>(originalNeon, NOTE_FIELD_MAPPING.neonToGql);
      const roundtrippedNeon = mapGqlToNeon<Note>(gqlData, NOTE_FIELD_MAPPING.gqlToNeon);

      expect(roundtrippedNeon.id).toBe('note-roundtrip-001');
      expect(roundtrippedNeon.engagement_id).toBe('eng-roundtrip-001');
      expect(roundtrippedNeon.folder_id).toBe('folder-roundtrip-001');
      expect(roundtrippedNeon.title).toBe('Assessment Findings');
      expect(roundtrippedNeon.body).toBe('Detailed findings from compliance review');
      expect(roundtrippedNeon.access_level).toBe('boundary');
    });

    it('should preserve meeting minutes metadata', () => {
      const originalNeon = makeNote({
        is_meeting_minutes: true,
        meeting_date: '2026-03-18T14:00:00Z',
        meeting_duration_minutes: 60,
      });

      const gqlData = mapNeonToGql<GqlNoteResponse>(originalNeon, NOTE_FIELD_MAPPING.neonToGql);
      const roundtrippedNeon = mapGqlToNeon<Note>(gqlData, NOTE_FIELD_MAPPING.gqlToNeon);

      expect(roundtrippedNeon.is_meeting_minutes).toBe(true);
      expect(roundtrippedNeon.meeting_date).toBe('2026-03-18T14:00:00Z');
      expect(roundtrippedNeon.meeting_duration_minutes).toBe(60);
    });
  });

  describe('Field count verification', () => {
    it('should have equal forward and reverse mapping sizes', () => {
      const forwardKeys = Object.keys(NOTE_FIELD_MAPPING.neonToGql);
      const reverseKeys = Object.keys(NOTE_FIELD_MAPPING.gqlToNeon);
      expect(forwardKeys.length).toBe(reverseKeys.length);
    });
  });
});
