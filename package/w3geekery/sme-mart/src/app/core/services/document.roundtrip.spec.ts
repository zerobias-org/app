/**
 * Roundtrip Field Validation Tests for SmeMartDocument Entity
 *
 * Validates that no fields are lost during Neon → GQL → Neon transformation cycles.
 * Tests file metadata and task attachment relationships.
 */

import { describe, it, expect } from 'vitest';
import { mapNeonToGql, mapGqlToNeon, DOCUMENT_FIELD_MAPPING } from '@/core/field-mappings';
import { DOCUMENT_GQL_FIXTURE } from '@/test-helpers/gql-fixtures';
import type { GqlDocumentResponse } from '@/core/gql-types';
import type { EngagementDocument } from '@/core/models/document.model';

/**
 * Test factory to create a Neon EngagementDocument object with all fields populated
 */
function makeDocument(overrides?: Partial<EngagementDocument>): EngagementDocument {
  return {
    id: 'doc-001',
    engagement_id: 'eng-001',
    zb_file_id: 'file-uuid-001',
    zb_file_version_id: 'file-version-uuid-001',
    filename: 'HIPAA_Audit_Report_Final.pdf',
    mime_type: 'application/pdf',
    file_size_bytes: 2457600,
    document_type: 'compliance',
    display_name: 'Final Audit Report',
    description: 'Final audit report with findings and recommendations',
    zb_task_id: null,
    zb_task_attachment_id: null,
    uploaded_by_zerobias_user_id: 'user-provider-001',
    created_at: '2026-03-18T14:30:00Z',
    updated_at: '2026-03-18T14:30:00Z',
    archived: false,
    ...overrides,
  };
}

describe('INFRA-04: SmeMartDocument Roundtrip Field Validation', () => {
  describe('Neon → GQL transformation', () => {
    it('should map all Neon EngagementDocument fields to GQL camelCase', () => {
      const neonModel = makeDocument();

      const gqlData = mapNeonToGql<GqlDocumentResponse>(
        neonModel,
        DOCUMENT_FIELD_MAPPING.neonToGql,
      );

      expect(gqlData.id).toBe('doc-001');
      expect(gqlData.engagementId).toBe('eng-001');
      expect(gqlData.zbFileId).toBe('file-uuid-001');
      expect(gqlData.zbFileVersionId).toBe('file-version-uuid-001');
      expect(gqlData.filename).toBe('HIPAA_Audit_Report_Final.pdf');
      expect(gqlData.mimeType).toBe('application/pdf');
      expect(gqlData.fileSizeBytes).toBe(2457600);
      expect(gqlData.documentType).toBe('compliance');
      expect(gqlData.displayName).toBe('Final Audit Report');
      expect(gqlData.description).toBe('Final audit report with findings and recommendations');
      expect(gqlData.uploadedByZerobiasUserId).toBe('user-provider-001');
      expect(gqlData.archived).toBe(false);
      expect(gqlData.createdAt).toBe('2026-03-18T14:30:00Z');
      expect(gqlData.updatedAt).toBe('2026-03-18T14:30:00Z');
    });

    it('should not lose fields in Neon → GQL mapping', () => {
      const neonModel = makeDocument();
      const gqlData = mapNeonToGql<GqlDocumentResponse>(
        neonModel,
        DOCUMENT_FIELD_MAPPING.neonToGql,
      );
      const gqlKeys = Object.keys(gqlData);

      const expectedFieldCount = Object.keys(DOCUMENT_FIELD_MAPPING.neonToGql).length;
      expect(gqlKeys.length).toBe(expectedFieldCount);

      expect(gqlData.id).toBeDefined();
      expect(gqlData.engagementId).toBeDefined();
      expect(gqlData.zbFileId).toBeDefined();
      expect(gqlData.filename).toBeDefined();
      expect(gqlData.uploadedByZerobiasUserId).toBeDefined();
    });

    it('should handle various document types', () => {
      const documentTypes = [
        'security_requirements',
        'sow',
        'budget',
        'legal_terms',
        'compliance',
        'functional_spec',
        'other',
      ];

      for (const docType of documentTypes) {
        const neonModel = makeDocument({ document_type: docType as any });
        const gqlData = mapNeonToGql<GqlDocumentResponse>(
          neonModel,
          DOCUMENT_FIELD_MAPPING.neonToGql,
        );
        expect(gqlData.documentType).toBe(docType);
      }
    });

    it('should preserve file metadata', () => {
      const neonModel = makeDocument({
        file_size_bytes: 5242880, // 5 MB
        mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        filename: 'Requirements_Document.docx',
      });

      const gqlData = mapNeonToGql<GqlDocumentResponse>(
        neonModel,
        DOCUMENT_FIELD_MAPPING.neonToGql,
      );

      expect(gqlData.fileSizeBytes).toBe(5242880);
      expect(gqlData.mimeType).toBe(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      );
      expect(gqlData.filename).toBe('Requirements_Document.docx');
    });

    it('should handle task attachment fields', () => {
      const neonModel = makeDocument({
        zb_task_id: 'task-uuid-001',
        zb_task_attachment_id: 'attachment-uuid-001',
      });

      const gqlData = mapNeonToGql<GqlDocumentResponse>(
        neonModel,
        DOCUMENT_FIELD_MAPPING.neonToGql,
      );

      expect(gqlData.zbTaskId).toBe('task-uuid-001');
      expect(gqlData.zbTaskAttachmentId).toBe('attachment-uuid-001');
    });

    it('should handle null/optional fields correctly', () => {
      const neonModel = makeDocument({
        mime_type: null,
        file_size_bytes: null,
        display_name: null,
        description: null,
        zb_task_id: null,
      });

      const gqlData = mapNeonToGql<GqlDocumentResponse>(
        neonModel,
        DOCUMENT_FIELD_MAPPING.neonToGql,
      );

      expect(gqlData.mimeType).toBeNull();
      expect(gqlData.fileSizeBytes).toBeNull();
      expect(gqlData.displayName).toBeNull();
      expect(gqlData.description).toBeNull();
      expect(gqlData.zbTaskId).toBeNull();
    });
  });

  describe('GQL → Neon reverse transformation', () => {
    it('should reverse-map all GQL fields back to Neon snake_case', () => {
      const gqlData = DOCUMENT_GQL_FIXTURE;
      const neonModel = mapGqlToNeon<EngagementDocument>(
        gqlData,
        DOCUMENT_FIELD_MAPPING.gqlToNeon,
      );

      expect(neonModel.id).toBe('doc-001-uuid-hipaa-audit-report');
      expect(neonModel.engagement_id).toBe('eng-001-uuid-hipaa-assessment');
      expect(neonModel.zb_file_id).toBe('file-uuid-001');
      expect(neonModel.zb_file_version_id).toBe('file-version-uuid-001');
      expect(neonModel.filename).toBe('HIPAA_Audit_Report_Final.pdf');
      expect(neonModel.document_type).toBe('compliance');
    });

    it('should not lose fields in GQL → Neon mapping', () => {
      const gqlData = DOCUMENT_GQL_FIXTURE;
      const neonModel = mapGqlToNeon<EngagementDocument>(
        gqlData,
        DOCUMENT_FIELD_MAPPING.gqlToNeon,
      );
      const neonKeys = Object.keys(neonModel);

      const expectedFieldCount = Object.keys(DOCUMENT_FIELD_MAPPING.gqlToNeon).length;
      expect(neonKeys.length).toBe(expectedFieldCount);
    });
  });

  describe('Roundtrip: Neon → GQL → Neon', () => {
    it('should preserve all fields in complete roundtrip cycle', () => {
      const originalNeon = makeDocument({
        id: 'doc-roundtrip-001',
        engagement_id: 'eng-roundtrip-001',
        filename: 'Roundtrip_Document.pdf',
        document_type: 'functional_spec',
        display_name: 'Functional Specification',
      });

      const gqlData = mapNeonToGql<GqlDocumentResponse>(
        originalNeon,
        DOCUMENT_FIELD_MAPPING.neonToGql,
      );
      const roundtrippedNeon = mapGqlToNeon<EngagementDocument>(
        gqlData,
        DOCUMENT_FIELD_MAPPING.gqlToNeon,
      );

      expect(roundtrippedNeon.id).toBe('doc-roundtrip-001');
      expect(roundtrippedNeon.engagement_id).toBe('eng-roundtrip-001');
      expect(roundtrippedNeon.filename).toBe('Roundtrip_Document.pdf');
      expect(roundtrippedNeon.document_type).toBe('functional_spec');
      expect(roundtrippedNeon.display_name).toBe('Functional Specification');
    });

    it('should preserve file metadata through roundtrip', () => {
      const originalNeon = makeDocument({
        file_size_bytes: 3145728, // 3 MB
        mime_type: 'application/pdf',
        filename: 'Large_Document.pdf',
      });

      const gqlData = mapNeonToGql<GqlDocumentResponse>(
        originalNeon,
        DOCUMENT_FIELD_MAPPING.neonToGql,
      );
      const roundtrippedNeon = mapGqlToNeon<EngagementDocument>(
        gqlData,
        DOCUMENT_FIELD_MAPPING.gqlToNeon,
      );

      expect(roundtrippedNeon.file_size_bytes).toBe(3145728);
      expect(roundtrippedNeon.mime_type).toBe('application/pdf');
      expect(roundtrippedNeon.filename).toBe('Large_Document.pdf');
    });

    it('should preserve task attachment relationships', () => {
      const originalNeon = makeDocument({
        zb_task_id: 'task-evidence-001',
        zb_task_attachment_id: 'evidence-attachment-uuid-001',
        document_type: 'compliance',
      });

      const gqlData = mapNeonToGql<GqlDocumentResponse>(
        originalNeon,
        DOCUMENT_FIELD_MAPPING.neonToGql,
      );
      const roundtrippedNeon = mapGqlToNeon<EngagementDocument>(
        gqlData,
        DOCUMENT_FIELD_MAPPING.gqlToNeon,
      );

      expect(roundtrippedNeon.zb_task_id).toBe('task-evidence-001');
      expect(roundtrippedNeon.zb_task_attachment_id).toBe('evidence-attachment-uuid-001');
    });
  });

  describe('Field count verification', () => {
    it('should have equal forward and reverse mapping sizes', () => {
      const forwardKeys = Object.keys(DOCUMENT_FIELD_MAPPING.neonToGql);
      const reverseKeys = Object.keys(DOCUMENT_FIELD_MAPPING.gqlToNeon);
      expect(forwardKeys.length).toBe(reverseKeys.length);
    });
  });
});
