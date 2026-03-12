import {
  SME_MART_PREFIX,
  isSmeMartTag,
  isProtectedTag,
  isOldConventionTag,
  parseScope,
  buildPrefix,
  stripPrefix,
  migrateOldTag,
  parseHierarchyLevel,
} from './tag-prefix.util';

describe('tag-prefix.util', () => {

  describe('isSmeMartTag', () => {
    it('should match sme-mart.* tags', () => {
      expect(isSmeMartTag('sme-mart.eng.amber-circuit')).toBe(true);
      expect(isSmeMartTag('sme-mart.proj.falcon-ridge')).toBe(true);
      expect(isSmeMartTag('sme-mart.compliance')).toBe(true);
    });

    it('should be case insensitive', () => {
      expect(isSmeMartTag('SME-MART.eng.amber-circuit')).toBe(true);
      expect(isSmeMartTag('Sme-Mart.proj.falcon-ridge')).toBe(true);
    });

    it('should reject non-sme-mart tags', () => {
      expect(isSmeMartTag('ENG-amber-circuit')).toBe(false);
      expect(isSmeMartTag('my-tag')).toBe(false);
      expect(isSmeMartTag('')).toBe(false);
    });
  });

  describe('isProtectedTag', () => {
    it('should protect sme-mart.eng.* tags', () => {
      expect(isProtectedTag('sme-mart.eng.amber-circuit')).toBe(true);
    });

    it('should protect sme-mart.proj.* tags', () => {
      expect(isProtectedTag('sme-mart.proj.falcon-ridge')).toBe(true);
    });

    it('should protect old ENG-/PROJ- tags (backward compat)', () => {
      expect(isProtectedTag('ENG-amber-circuit')).toBe(true);
      expect(isProtectedTag('PROJ-falcon-ridge')).toBe(true);
    });

    it('should not protect task or generic tags', () => {
      expect(isProtectedTag('sme-mart.task.coral-delta')).toBe(false);
      expect(isProtectedTag('sme-mart.compliance')).toBe(false);
      expect(isProtectedTag('my-tag')).toBe(false);
    });
  });

  describe('isOldConventionTag', () => {
    it('should detect ENG-/PROJ-/TASK- prefixes', () => {
      expect(isOldConventionTag('ENG-amber-circuit')).toBe(true);
      expect(isOldConventionTag('PROJ-falcon-ridge')).toBe(true);
      expect(isOldConventionTag('TASK-coral-delta')).toBe(true);
    });

    it('should reject new convention and plain tags', () => {
      expect(isOldConventionTag('sme-mart.eng.amber-circuit')).toBe(false);
      expect(isOldConventionTag('my-tag')).toBe(false);
    });
  });

  describe('parseScope', () => {
    it('should parse engagement tag', () => {
      const scope = parseScope('sme-mart.eng.amber-circuit');
      expect(scope.dimension).toBe('eng');
      expect(scope.identifier).toBe('amber-circuit');
      expect(scope.segments).toBeUndefined();
    });

    it('should parse project tag', () => {
      const scope = parseScope('sme-mart.proj.falcon-ridge');
      expect(scope.dimension).toBe('proj');
      expect(scope.identifier).toBe('falcon-ridge');
    });

    it('should parse task tag', () => {
      const scope = parseScope('sme-mart.task.coral-delta');
      expect(scope.dimension).toBe('task');
      expect(scope.identifier).toBe('coral-delta');
    });

    it('should parse scoped tag with additional segments', () => {
      const scope = parseScope('sme-mart.eng.amber-circuit.risk');
      expect(scope.dimension).toBe('eng');
      expect(scope.identifier).toBe('amber-circuit');
      expect(scope.segments).toEqual(['risk']);
    });

    it('should parse multi-segment scoped tag', () => {
      const scope = parseScope('sme-mart.eng.amber-circuit.risk.high');
      expect(scope.dimension).toBe('eng');
      expect(scope.identifier).toBe('amber-circuit');
      expect(scope.segments).toEqual(['risk', 'high']);
    });

    it('should parse global sme-mart tag without dimension', () => {
      const scope = parseScope('sme-mart.compliance');
      expect(scope.dimension).toBeUndefined();
      expect(scope.identifier).toBeUndefined();
      expect(scope.segments).toEqual(['compliance']);
    });

    it('should return empty scope for non-sme-mart tags', () => {
      const scope = parseScope('ENG-amber-circuit');
      expect(scope.dimension).toBeUndefined();
      expect(scope.identifier).toBeUndefined();
      expect(scope.segments).toBeUndefined();
    });

    it('should handle dimension without identifier', () => {
      const scope = parseScope('sme-mart.eng');
      expect(scope.dimension).toBe('eng');
      expect(scope.identifier).toBeUndefined();
    });
  });

  describe('buildPrefix', () => {
    it('should build engagement tag', () => {
      expect(buildPrefix({ dimension: 'eng', identifier: 'amber-circuit' }))
        .toBe('sme-mart.eng.amber-circuit');
    });

    it('should build project tag', () => {
      expect(buildPrefix({ dimension: 'proj', identifier: 'falcon-ridge' }))
        .toBe('sme-mart.proj.falcon-ridge');
    });

    it('should build scoped tag with segments', () => {
      expect(buildPrefix({ dimension: 'eng', identifier: 'amber-circuit', segments: ['risk'] }))
        .toBe('sme-mart.eng.amber-circuit.risk');
    });

    it('should build dimension-only prefix', () => {
      expect(buildPrefix({ dimension: 'eng' })).toBe('sme-mart.eng');
    });

    it('should build global tag with segments only', () => {
      expect(buildPrefix({ segments: ['compliance'] })).toBe('sme-mart.compliance');
    });

    it('should build bare sme-mart prefix with empty scope', () => {
      expect(buildPrefix({})).toBe('sme-mart');
    });
  });

  describe('stripPrefix', () => {
    it('should strip sme-mart.eng. prefix', () => {
      expect(stripPrefix('sme-mart.eng.amber-circuit')).toBe('amber-circuit');
    });

    it('should strip sme-mart.proj. prefix', () => {
      expect(stripPrefix('sme-mart.proj.falcon-ridge')).toBe('falcon-ridge');
    });

    it('should return segments for scoped tags', () => {
      expect(stripPrefix('sme-mart.eng.amber-circuit.risk')).toBe('risk');
    });

    it('should return joined segments for multi-segment scoped tags', () => {
      expect(stripPrefix('sme-mart.eng.amber-circuit.risk.high')).toBe('risk.high');
    });

    it('should strip old ENG- prefix (backward compat)', () => {
      expect(stripPrefix('ENG-amber-circuit')).toBe('amber-circuit');
    });

    it('should strip old PROJ- prefix', () => {
      expect(stripPrefix('PROJ-falcon-ridge')).toBe('falcon-ridge');
    });

    it('should strip old TASK- prefix', () => {
      expect(stripPrefix('TASK-coral-delta')).toBe('coral-delta');
    });

    it('should return plain tags unchanged', () => {
      expect(stripPrefix('my-custom-tag')).toBe('my-custom-tag');
    });

    it('should return global sme-mart tags as segment', () => {
      expect(stripPrefix('sme-mart.compliance')).toBe('compliance');
    });
  });

  describe('migrateOldTag', () => {
    it('should migrate ENG- to sme-mart.eng.', () => {
      expect(migrateOldTag('ENG-amber-circuit')).toBe('sme-mart.eng.amber-circuit');
    });

    it('should migrate PROJ- to sme-mart.proj.', () => {
      expect(migrateOldTag('PROJ-falcon-ridge')).toBe('sme-mart.proj.falcon-ridge');
    });

    it('should migrate TASK- to sme-mart.task.', () => {
      expect(migrateOldTag('TASK-coral-delta')).toBe('sme-mart.task.coral-delta');
    });

    it('should return null for non-old-convention tags', () => {
      expect(migrateOldTag('sme-mart.eng.amber-circuit')).toBeNull();
      expect(migrateOldTag('my-tag')).toBeNull();
    });
  });

  describe('parseHierarchyLevel', () => {
    it('should return boundary for eng tags', () => {
      expect(parseHierarchyLevel('sme-mart.eng.amber-circuit')).toBe('boundary');
      expect(parseHierarchyLevel('ENG-amber-circuit')).toBe('boundary');
    });

    it('should return project for proj tags', () => {
      expect(parseHierarchyLevel('sme-mart.proj.falcon-ridge')).toBe('project');
      expect(parseHierarchyLevel('PROJ-falcon-ridge')).toBe('project');
    });

    it('should return task for task tags', () => {
      expect(parseHierarchyLevel('sme-mart.task.coral-delta')).toBe('task');
      expect(parseHierarchyLevel('TASK-coral-delta')).toBe('task');
    });

    it('should return null for non-hierarchy tags', () => {
      expect(parseHierarchyLevel('sme-mart.compliance')).toBeNull();
      expect(parseHierarchyLevel('my-tag')).toBeNull();
    });
  });

  describe('roundtrip: parseScope → buildPrefix', () => {
    const cases = [
      'sme-mart.eng.amber-circuit',
      'sme-mart.proj.falcon-ridge',
      'sme-mart.task.coral-delta',
      'sme-mart.eng.amber-circuit.risk',
      'sme-mart.eng.amber-circuit.risk.high',
      'sme-mart.compliance',
    ];

    cases.forEach(tag => {
      it(`should roundtrip "${tag}"`, () => {
        expect(buildPrefix(parseScope(tag))).toBe(tag);
      });
    });
  });
});
