import { describe, it, expect, beforeEach } from 'vitest';
import { LocalStoragePinStorage } from './pin-storage-local.service';

const KEY = 'sme-mart.pins';

describe('LocalStoragePinStorage', () => {
  let svc: LocalStoragePinStorage;

  beforeEach(() => {
    localStorage.clear();
    svc = new LocalStoragePinStorage();
  });

  it('returns false for an unpinned board after load', async () => {
    await svc.load();
    expect(svc.getPin('b1')).toBe(false);
  });

  it('setPin persists to localStorage and getPin reads it back synchronously', async () => {
    await svc.load();
    svc.setPin('b1', true);
    expect(svc.getPin('b1')).toBe(true);
    expect(JSON.parse(localStorage.getItem(KEY) ?? '{}')).toEqual({ b1: true });
  });

  it('hydrates the in-memory Map from localStorage on load', async () => {
    localStorage.setItem(KEY, JSON.stringify({ b2: true }));
    await svc.load();
    expect(svc.getPin('b2')).toBe(true);
  });

  it('setPin(false) removes the pin', async () => {
    await svc.load();
    svc.setPin('b1', true);
    svc.setPin('b1', false);
    expect(svc.getPin('b1')).toBe(false);
    expect(JSON.parse(localStorage.getItem(KEY) ?? '{}')).toEqual({});
  });

  it('clearPin removes one, clearAll removes all', async () => {
    await svc.load();
    svc.setPin('a', true);
    svc.setPin('b', true);
    svc.clearPin('a');
    expect(svc.getPin('a')).toBe(false);
    expect(svc.getPin('b')).toBe(true);
    svc.clearAll();
    expect(svc.getPin('b')).toBe(false);
  });

  it('starts empty (does not throw) when storage is corrupt', async () => {
    localStorage.setItem(KEY, 'not json{');
    await svc.load();
    expect(svc.getPin('x')).toBe(false);
  });

  it('persists across instances (reload simulation)', async () => {
    await svc.load();
    svc.setPin('b1', true);
    const fresh = new LocalStoragePinStorage();
    await fresh.load();
    expect(fresh.getPin('b1')).toBe(true);
  });
});
