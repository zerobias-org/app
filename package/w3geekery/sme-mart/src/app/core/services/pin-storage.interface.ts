import { InjectionToken } from '@angular/core';

/**
 * Pin storage contract for persisting board pin state.
 *
 * Hydration model: `load()` fills an in-memory Map. `getPin` reads that Map
 * synchronously (template- and change-detection-friendly). `setPin` updates the Map
 * synchronously then does fire-and-forget write-through to the backing store.
 *
 * This shape enables a future localStorage -> PKV swap (D-Q10) with ZERO call-site
 * changes: `load()` carries the only async cost (a network fetch in the PKV impl);
 * `getPin`/`setPin` stay synchronous. PKV is deferred — UAT IAM gap (Platform-Team
 * Ask #12) — so Foundation ships localStorage only.
 */
export interface PinStorage {
  /**
   * Hydrate the in-memory pin cache from the backing store. MUST be awaited during
   * component init BEFORE deriving pinned/unpinned arrays for first render.
   * localStorage impl: sync read wrapped in Promise.resolve(). PKV impl: async fetch.
   */
  load(): Promise<void>;

  /** Sync read off the hydrated Map. @returns true if the board is pinned. */
  getPin(boardId: string): boolean;

  /** Sync Map update + fire-and-forget write-through to the backing store. */
  setPin(boardId: string, isPinned: boolean): void;

  /** Sync Map delete + write-through. */
  clearPin(boardId: string): void;

  /** Sync Map clear + write-through. */
  clearAll(): void;
}

export const PIN_STORAGE_TOKEN = new InjectionToken<PinStorage>('PIN_STORAGE');
