import { inject, Injectable } from '@angular/core';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import { Pkv } from '@zerobias-com/dana-sdk';
import type { PinStorage } from './pin-storage.interface';

const STORAGE_KEY = 'sme-mart.pins';

/**
 * PKV-backed pin storage: PKV is the primary cross-device store, localStorage is the
 * fallback + mirror. Source of truth for reads is an in-memory Map (sync `getPin`),
 * so this is a drop-in for LocalStoragePinStorage behind PIN_STORAGE_TOKEN (D-Q10).
 *
 * - load(): fetch from PKV; on failure or empty, fall back to localStorage. The resolved
 *   set is mirrored back to localStorage so a later cold start still has data if PKV is
 *   briefly unavailable.
 * - setPin/clearPin/clearAll: update the Map synchronously, then fire-and-forget
 *   write-through to BOTH localStorage (immediate, reliable) and PKV (cross-device sync).
 *
 * Trade-off (same as the localStorage impl): write-through is fire-and-forget — a failed
 * PKV write is logged, not surfaced. Pin state is cosmetic (no auth/resource impact); the
 * server never relies on it.
 */
@Injectable({ providedIn: 'root' })
export class PkvPinStorage implements PinStorage {
  private readonly clientApi = inject(ZerobiasClientApi);
  private pins = new Map<string, boolean>();

  async load(): Promise<void> {
    // 1. PKV (primary, cross-device).
    try {
      const pkv = await this.clientApi.danaClient.getPkvApi().getPrincipalKeyValue(STORAGE_KEY);
      if (pkv?.value) {
        this.pins = new Map(Object.entries(pkv.value as unknown as Record<string, boolean>));
        this.mirrorToLocalStorage();
        return;
      }
    } catch {
      // PKV unavailable — fall through to localStorage.
    }
    // 2. Fallback: localStorage.
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.pins = new Map(Object.entries(JSON.parse(stored) as Record<string, boolean>));
      }
    } catch (e) {
      console.warn('PkvPinStorage.load fallback failed; starting with empty pin set:', e);
      this.pins = new Map();
    }
  }

  getPin(boardId: string): boolean {
    return this.pins.get(boardId) ?? false;
  }

  setPin(boardId: string, isPinned: boolean): void {
    if (isPinned) {
      this.pins.set(boardId, true);
    } else {
      this.pins.delete(boardId);
    }
    this.writeThrough();
  }

  clearPin(boardId: string): void {
    this.pins.delete(boardId);
    this.writeThrough();
  }

  clearAll(): void {
    this.pins.clear();
    this.writeThrough();
  }

  /** Fire-and-forget write-through to localStorage (immediate) + PKV (cross-device). */
  private writeThrough(): void {
    this.mirrorToLocalStorage();
    void this.writePkv();
  }

  private mirrorToLocalStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(this.pins)));
    } catch (e) {
      console.error('PkvPinStorage localStorage mirror failed (pin state not persisted locally):', e);
    }
  }

  private async writePkv(): Promise<void> {
    try {
      const pkv = new Pkv(STORAGE_KEY, Object.fromEntries(this.pins) as unknown as { [k: string]: object });
      await this.clientApi.danaClient.getPkvApi().upsertPrincipalKeyValue(pkv);
    } catch {
      // localStorage already holds the data; a failed PKV write is non-fatal (cosmetic state).
    }
  }
}
