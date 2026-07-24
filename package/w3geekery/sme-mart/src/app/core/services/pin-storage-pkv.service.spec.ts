import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import { PkvPinStorage } from './pin-storage-pkv.service';

const KEY = 'sme-mart.pins';

describe('PkvPinStorage', () => {
  let svc: PkvPinStorage;
  let getPkv: ReturnType<typeof vi.fn>;
  let upsertPkv: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.clear();
    getPkv = vi.fn();
    upsertPkv = vi.fn().mockResolvedValue(undefined);
    const mockApi = {
      danaClient: {
        getPkvApi: () => ({
          getPrincipalKeyValue: getPkv,
          upsertPrincipalKeyValue: upsertPkv,
        }),
      },
    };
    TestBed.configureTestingModule({
      providers: [
        PkvPinStorage,
        { provide: ZerobiasClientApi, useValue: mockApi },
      ],
    });
    svc = TestBed.inject(PkvPinStorage);
  });

  it('loads from PKV (primary) and mirrors to localStorage', async () => {
    getPkv.mockResolvedValue({ value: { b1: true } });
    await svc.load();
    expect(svc.getPin('b1')).toBe(true);
    expect(JSON.parse(localStorage.getItem(KEY) ?? '{}')).toEqual({ b1: true });
  });

  it('falls back to localStorage when the PKV read throws', async () => {
    getPkv.mockRejectedValue(new Error('PKV down'));
    localStorage.setItem(KEY, JSON.stringify({ b2: true }));
    await svc.load();
    expect(svc.getPin('b2')).toBe(true);
  });

  it('falls back to localStorage when PKV returns an empty value', async () => {
    getPkv.mockResolvedValue(null);
    localStorage.setItem(KEY, JSON.stringify({ z: true }));
    await svc.load();
    expect(svc.getPin('z')).toBe(true);
  });

  it('setPin updates the Map synchronously, mirrors localStorage, and writes PKV', async () => {
    getPkv.mockResolvedValue({ value: {} });
    await svc.load();
    svc.setPin('b1', true);
    expect(svc.getPin('b1')).toBe(true);
    expect(JSON.parse(localStorage.getItem(KEY) ?? '{}')).toEqual({ b1: true });
    expect(upsertPkv).toHaveBeenCalled();
  });

  it('setPin(false) / clearPin / clearAll remove pins', async () => {
    getPkv.mockResolvedValue({ value: {} });
    await svc.load();
    svc.setPin('a', true);
    svc.setPin('b', true);
    svc.setPin('a', false);
    expect(svc.getPin('a')).toBe(false);
    svc.clearPin('b');
    expect(svc.getPin('b')).toBe(false);
    svc.setPin('c', true);
    svc.clearAll();
    expect(svc.getPin('c')).toBe(false);
  });

  it('PKV write failure is non-fatal — localStorage still holds the pin', async () => {
    getPkv.mockResolvedValue({ value: {} });
    upsertPkv.mockRejectedValue(new Error('write fail'));
    await svc.load();
    svc.setPin('b1', true);
    expect(svc.getPin('b1')).toBe(true);
    expect(JSON.parse(localStorage.getItem(KEY) ?? '{}')).toEqual({ b1: true });
  });
});
