import { Injectable } from '@angular/core';
import type { PinStorage } from './pin-storage.interface';

const STORAGE_KEY = 'sme-mart.pins';

/**
 * localStorage-backed pin storage. Source of truth is an in-memory Map (sync reads);
 * localStorage is the persistence layer. On-disk shape: `{ [boardId]: true }`.
 *
 * PKV swap (D-Q10, ACCEPTED FOUNDATION LIMITATION): a future PKV impl makes `load()`
 * the async network fetch into the same Map; `getPin` stays sync; `setPin` does
 * fire-and-forget async write-through. The swap touches ONLY this class — never a call
 * site. Trade-off: `setPin` has no write-confirmation/error path to the user (a failed
 * write is logged, not reported). Accepted because pin state is cosmetic (UX preference,
 * no auth/resource impact); the server never relies on it.
 */
@Injectable({ providedIn: 'root' })
export class LocalStoragePinStorage implements PinStorage {
  private pins = new Map<string, boolean>();

  load(): Promise<void> {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored) as Record<string, boolean>;
        this.pins = new Map(Object.entries(data));
      }
    } catch (e) {
      // Corrupt/disabled storage: start empty rather than crash hydration.
      console.warn('PinStorage.load failed; starting with empty pin set:', e);
      this.pins = new Map();
    }
    return Promise.resolve();
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

  /** Fire-and-forget write-through; no write-confirmation surfaced (see class note). */
  private writeThrough(): void {
    try {
      const data = Object.fromEntries(this.pins);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      // Quota exceeded / private mode: log, do not surface. Pin state is cosmetic.
      console.error('PinStorage.writeThrough failed (pin state not persisted):', e);
    }
  }
}
