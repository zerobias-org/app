import type { UUID } from '@zerobias-org/types-core-js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * A `toUUID` test double mirroring the real client: returns a valid-looking UUID as-is, throws on
 * anything else. The request builders call `toUUID` inside try/catch, so a throw = "omit this id".
 */
export const fakeToUuid = (s: string): UUID => {
  const str = String(s).trim();
  if (!UUID_RE.test(str)) throw new Error(`not a uuid: ${str}`);
  return str as unknown as UUID;
};

/** A stable, valid sample UUID for tests. */
export const SAMPLE_UUID = 'c4e17a0b-2d93-4f61-8a5c-6b0e9d21f7a4' as unknown as UUID;
export const SAMPLE_UUID_2 = '8f2a1c7d-6b4e-4a90-b1c3-2d5e6f7a8b9c' as unknown as UUID;

/**
 * Compare ids by VALUE, not identity. An id may be a raw string or a real `UUID` instance
 * depending on how it was produced; `expect(uuid(actual)).toBe(uuid(SAMPLE_UUID))` asserts what we
 * actually care about (the id is right) without depending on which representation is used.
 */
export const uuid = (value: unknown): string => String(value);
