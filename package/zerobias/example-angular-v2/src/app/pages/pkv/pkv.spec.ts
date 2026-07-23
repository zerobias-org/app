import { parsePkvValue } from './pkv';

/**
 * `Pkv.value` is a JSON object map. The form rejects anything that isn't a plain object before the
 * upsert, so the payload is always well-shaped.
 */
describe('parsePkvValue', () => {
  it('accepts a JSON object and returns it', () => {
    expect(parsePkvValue('{ "enabled": true, "n": 3 }')).toEqual({ enabled: true, n: 3 });
  });

  it('rejects a JSON array', () => {
    expect(parsePkvValue('[1, 2, 3]')).toBeNull();
  });

  it('rejects JSON primitives', () => {
    expect(parsePkvValue('42')).toBeNull();
    expect(parsePkvValue('"a string"')).toBeNull();
    expect(parsePkvValue('null')).toBeNull();
  });

  it('rejects malformed JSON', () => {
    expect(parsePkvValue('{ not json }')).toBeNull();
    expect(parsePkvValue('')).toBeNull();
  });
});
