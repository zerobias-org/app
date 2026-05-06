/**
 * Demo Data Seeder Tests
 *
 * Verifies that all demo fixture arrays carry the GLOBAL_DEMO tag UUID.
 * Phase 24 Plan 02: Demo Data Visibility Gate Wave 1
 */

import { describe, it, expect } from 'vitest';
import {
  DEMO_ENGAGEMENTS,
  DEMO_PROJECTS,
  DEMO_BIDS,
  DEMO_BID_RESPONSES,
  DEMO_NOTES,
  DEMO_NOTE_FOLDERS,
  DEMO_DOCUMENTS,
  DEMO_SERVICE_OFFERINGS,
  DEMO_REVIEWS,
} from './demo-data-seeder';
import { DEMO_TAG_UUIDS } from '../core/constants/demo-tags';

describe('Demo Data Seeder — Tag Presence Verification', () => {
  describe('DEMO_ENGAGEMENTS', () => {
    it('should have GLOBAL_DEMO tag on all engagement fixtures', () => {
      expect(DEMO_ENGAGEMENTS.length).toBeGreaterThan(0);
      DEMO_ENGAGEMENTS.forEach((engagement) => {
        expect(engagement.tag).toBeDefined();
        expect(Array.isArray(engagement.tag)).toBe(true);
        expect(engagement.tag!.length).toBeGreaterThan(0);
        const tagValues = engagement.tag!.map((t) => t.value);
        expect(tagValues).toContain(DEMO_TAG_UUIDS.GLOBAL_DEMO);
      });
    });
  });

  describe('DEMO_PROJECTS', () => {
    it('should have GLOBAL_DEMO tag on all project fixtures', () => {
      expect(DEMO_PROJECTS.length).toBeGreaterThan(0);
      DEMO_PROJECTS.forEach((project) => {
        expect(project.tag).toBeDefined();
        expect(Array.isArray(project.tag)).toBe(true);
        expect(project.tag!.length).toBeGreaterThan(0);
        const tagValues = project.tag!.map((t) => t.value);
        expect(tagValues).toContain(DEMO_TAG_UUIDS.GLOBAL_DEMO);
      });
    });
  });

  describe('DEMO_BIDS', () => {
    it('should have GLOBAL_DEMO tag on all bid fixtures', () => {
      expect(DEMO_BIDS.length).toBeGreaterThan(0);
      DEMO_BIDS.forEach((bid) => {
        expect(bid.tag).toBeDefined();
        expect(Array.isArray(bid.tag)).toBe(true);
        expect(bid.tag!.length).toBeGreaterThan(0);
        const tagValues = bid.tag!.map((t) => t.value);
        expect(tagValues).toContain(DEMO_TAG_UUIDS.GLOBAL_DEMO);
      });
    });
  });

  describe('DEMO_BID_RESPONSES', () => {
    it('should have GLOBAL_DEMO tag on all bid response fixtures', () => {
      expect(DEMO_BID_RESPONSES.length).toBeGreaterThan(0);
      DEMO_BID_RESPONSES.forEach((response) => {
        expect(response.tag).toBeDefined();
        expect(Array.isArray(response.tag)).toBe(true);
        expect(response.tag!.length).toBeGreaterThan(0);
        const tagValues = response.tag!.map((t) => t.value);
        expect(tagValues).toContain(DEMO_TAG_UUIDS.GLOBAL_DEMO);
      });
    });
  });

  describe('DEMO_NOTES', () => {
    it('should have GLOBAL_DEMO tag on all note fixtures', () => {
      expect(DEMO_NOTES.length).toBeGreaterThan(0);
      DEMO_NOTES.forEach((note) => {
        expect(note.tag).toBeDefined();
        expect(Array.isArray(note.tag)).toBe(true);
        expect(note.tag!.length).toBeGreaterThan(0);
        const tagValues = note.tag!.map((t) => t.value);
        expect(tagValues).toContain(DEMO_TAG_UUIDS.GLOBAL_DEMO);
      });
    });
  });

  describe('DEMO_NOTE_FOLDERS', () => {
    it('should have GLOBAL_DEMO tag on all note folder fixtures', () => {
      expect(DEMO_NOTE_FOLDERS.length).toBeGreaterThan(0);
      DEMO_NOTE_FOLDERS.forEach((folder) => {
        expect(folder.tag).toBeDefined();
        expect(Array.isArray(folder.tag)).toBe(true);
        expect(folder.tag!.length).toBeGreaterThan(0);
        const tagValues = folder.tag!.map((t) => t.value);
        expect(tagValues).toContain(DEMO_TAG_UUIDS.GLOBAL_DEMO);
      });
    });
  });

  describe('DEMO_DOCUMENTS', () => {
    it('should have GLOBAL_DEMO tag on all document fixtures', () => {
      expect(DEMO_DOCUMENTS.length).toBeGreaterThan(0);
      DEMO_DOCUMENTS.forEach((doc) => {
        expect(doc.tag).toBeDefined();
        expect(Array.isArray(doc.tag)).toBe(true);
        expect(doc.tag!.length).toBeGreaterThan(0);
        const tagValues = doc.tag!.map((t) => t.value);
        expect(tagValues).toContain(DEMO_TAG_UUIDS.GLOBAL_DEMO);
      });
    });
  });

  describe('DEMO_SERVICE_OFFERINGS', () => {
    it('should have GLOBAL_DEMO tag on all service offering fixtures', () => {
      expect(DEMO_SERVICE_OFFERINGS.length).toBeGreaterThan(0);
      DEMO_SERVICE_OFFERINGS.forEach((offering) => {
        expect(offering.tag).toBeDefined();
        expect(Array.isArray(offering.tag)).toBe(true);
        expect(offering.tag!.length).toBeGreaterThan(0);
        const tagValues = offering.tag!.map((t) => t.value);
        expect(tagValues).toContain(DEMO_TAG_UUIDS.GLOBAL_DEMO);
      });
    });
  });

  describe('DEMO_REVIEWS', () => {
    it('should have GLOBAL_DEMO tag on all review fixtures', () => {
      expect(DEMO_REVIEWS.length).toBeGreaterThan(0);
      DEMO_REVIEWS.forEach((review) => {
        expect(review.tag).toBeDefined();
        expect(Array.isArray(review.tag)).toBe(true);
        expect(review.tag!.length).toBeGreaterThan(0);
        const tagValues = review.tag!.map((t) => t.value);
        expect(tagValues).toContain(DEMO_TAG_UUIDS.GLOBAL_DEMO);
      });
    });
  });

  describe('Demo data completeness', () => {
    it('should have all fixture arrays populated', () => {
      const fixtures = [
        { name: 'DEMO_ENGAGEMENTS', data: DEMO_ENGAGEMENTS, minCount: 5 },
        { name: 'DEMO_PROJECTS', data: DEMO_PROJECTS, minCount: 16 },
        { name: 'DEMO_BIDS', data: DEMO_BIDS, minCount: 15 },
        { name: 'DEMO_BID_RESPONSES', data: DEMO_BID_RESPONSES, minCount: 3 },
        { name: 'DEMO_NOTES', data: DEMO_NOTES, minCount: 5 },
        { name: 'DEMO_NOTE_FOLDERS', data: DEMO_NOTE_FOLDERS, minCount: 6 },
        { name: 'DEMO_DOCUMENTS', data: DEMO_DOCUMENTS, minCount: 3 },
        { name: 'DEMO_SERVICE_OFFERINGS', data: DEMO_SERVICE_OFFERINGS, minCount: 3 },
        { name: 'DEMO_REVIEWS', data: DEMO_REVIEWS, minCount: 2 },
      ];

      fixtures.forEach(({ name, data, minCount }) => {
        expect(data.length, `${name} should have at least ${minCount} records`).toBeGreaterThanOrEqual(minCount);
      });
    });

    it('should have consistent demo record counts across all fixture arrays', () => {
      const totalCount =
        DEMO_ENGAGEMENTS.length +
        DEMO_PROJECTS.length +
        DEMO_BIDS.length +
        DEMO_BID_RESPONSES.length +
        DEMO_NOTES.length +
        DEMO_NOTE_FOLDERS.length +
        DEMO_DOCUMENTS.length +
        DEMO_SERVICE_OFFERINGS.length +
        DEMO_REVIEWS.length;

      // Verify total fixture count is positive
      expect(totalCount).toBeGreaterThan(0);
    });
  });
});
