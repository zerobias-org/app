import { ZbTagPipe } from './zb-tag.pipe';

describe('ZbTagPipe', () => {
  const pipe = new ZbTagPipe();

  it('should strip sme-mart.eng. prefix', () => {
    expect(pipe.transform('sme-mart.eng.amber-circuit')).toBe('amber-circuit');
  });

  it('should strip sme-mart.proj. prefix', () => {
    expect(pipe.transform('sme-mart.proj.falcon-ridge')).toBe('falcon-ridge');
  });

  it('should strip old ENG- prefix', () => {
    expect(pipe.transform('ENG-amber-circuit')).toBe('amber-circuit');
  });

  it('should return plain tags unchanged', () => {
    expect(pipe.transform('my-custom-tag')).toBe('my-custom-tag');
  });

  it('should return empty string for null', () => {
    expect(pipe.transform(null)).toBe('');
  });

  it('should return empty string for undefined', () => {
    expect(pipe.transform(undefined)).toBe('');
  });

  it('should return empty string for empty string', () => {
    expect(pipe.transform('')).toBe('');
  });

  it('should handle scoped tags', () => {
    expect(pipe.transform('sme-mart.eng.amber-circuit.risk')).toBe('risk');
  });
});
