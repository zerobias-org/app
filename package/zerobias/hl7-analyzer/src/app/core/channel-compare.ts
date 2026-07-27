import { computed, inject, Injectable, signal } from '@angular/core';

import {
  compareChannels,
  toRecord,
  type ChannelComparison,
  type ChannelRecord,
  type FieldDifference,
} from './fingerprint';
import { Hl7Api, type Hl7MessageRow } from './hl7-api';
import type { Hl7SearchCriteria } from './hl7-filter';
import { messageOf } from './hl7-target.service';

/**
 * Runs a two-channel comparison and holds its state.
 *
 * ## Why there are two match modes
 *
 * Strict content matching — every field except the transport ones — is the honest default question:
 * "are these byte-for-byte the same message?" On real traffic the answer is almost always no. Two
 * ADT feeds off the same interface engine matched on only 37 of ~1200 messages that way, because
 * each downstream channel gets its own field tweaks. Read literally that says the channels are
 * unrelated, which is wrong: keyed on the business identity (account number + event type + event
 * time) the same two channels share 1160 of 1171 messages and differ on none.
 *
 * So the tool offers both, and defaults to the business key: strict mode answers "is the content
 * identical", identity mode answers "is the same event present on both", and only the second is a
 * useful reading of channel coverage. The differences strict mode would have called
 * population gaps show up in identity mode where they belong — as field conflicts on a shared
 * message.
 */

/** The default business key: what makes two ADT/ORU messages "the same event" in practice. */
export const DEFAULT_IDENTITY: readonly string[] = [
  'patientAccountNumber',
  'eventTypeCode',
  'recordedDateTime',
];

export type MatchMode = 'identity' | 'content';

export interface CompareRequest {
  readonly portA: string;
  readonly portB: string;
  readonly from?: string;
  readonly to?: string;
  readonly mode: MatchMode;
  /** Path substrings that define identity in `identity` mode. */
  readonly identity: readonly string[];
  /** Per-channel fetch ceiling. */
  readonly cap: number;
}

/** Conflicting fields rolled up by path, with array positions collapsed. */
export interface ConflictPath {
  readonly path: string;
  /** Coupled messages exhibiting a difference at this path. */
  readonly messages: number;
  /** Total differing occurrences (a repeating segment contributes many per message). */
  readonly occurrences: number;
  readonly sample: FieldDifference;
}

export type ComparePhase = 'idle' | 'fetching' | 'comparing' | 'done' | 'error' | 'cancelled';

@Injectable()
export class ChannelComparer {
  private readonly api = inject(Hl7Api);

  readonly phase = signal<ComparePhase>('idle');
  readonly error = signal<string | null>(null);
  readonly fetchedA = signal(0);
  readonly fetchedB = signal(0);
  readonly totalA = signal(0);
  readonly totalB = signal(0);
  readonly truncatedA = signal(false);
  readonly truncatedB = signal(false);
  readonly comparison = signal<ChannelComparison | null>(null);
  readonly request = signal<CompareRequest | null>(null);

  /**
   * True when either side was capped. Every "only on A" conclusion is then provisional: the
   * counterpart may simply be beyond the cut-off on B.
   */
  readonly provisional = computed(() => this.truncatedA() || this.truncatedB());

  /** Conflicting fields across all coupled messages, most widespread first. */
  readonly conflictPaths = computed<readonly ConflictPath[]>(() => {
    const comparison = this.comparison();
    if (!comparison) return [];
    interface Bucket {
      messages: number;
      occurrences: number;
      sample: FieldDifference;
    }
    const buckets = new Map<string, Bucket>();
    for (const coupling of comparison.couplings) {
      const seen = new Set<string>();
      for (const difference of coupling.conflicts) {
        const path = collapseIndices(difference.path);
        const bucket = buckets.get(path) ?? { messages: 0, occurrences: 0, sample: difference };
        bucket.occurrences += 1;
        if (!seen.has(path)) {
          bucket.messages += 1;
          seen.add(path);
        }
        buckets.set(path, bucket);
      }
    }
    return [...buckets.entries()]
      .map(([path, bucket]) => ({ path, ...bucket }))
      .sort((a, b) => b.messages - a.messages || b.occurrences - a.occurrences);
  });

  private controller: AbortController | null = null;

  get running(): boolean {
    return this.phase() === 'fetching' || this.phase() === 'comparing';
  }

  cancel(): void {
    this.controller?.abort();
  }

  reset(): void {
    this.cancel();
    this.phase.set('idle');
    this.error.set(null);
    this.fetchedA.set(0);
    this.fetchedB.set(0);
    this.totalA.set(0);
    this.totalB.set(0);
    this.truncatedA.set(false);
    this.truncatedB.set(false);
    this.comparison.set(null);
    this.request.set(null);
  }

  async run(request: CompareRequest): Promise<void> {
    this.reset();
    const controller = new AbortController();
    this.controller = controller;
    this.request.set(request);
    this.phase.set('fetching');

    try {
      const window = { from: request.from || undefined, to: request.to || undefined };
      const criteriaA: Hl7SearchCriteria = { ...window, sourcePort: request.portA };
      const criteriaB: Hl7SearchCriteria = { ...window, sourcePort: request.portB };

      // Both sides at once: they're independent queries and the wait is dominated by page count.
      const [sideA, sideB] = await Promise.all([
        this.api.fetchAll(criteriaA, {
          cap: request.cap,
          signal: controller.signal,
          onProgress: (n, total) => {
            this.fetchedA.set(n);
            this.totalA.set(total);
          },
        }),
        this.api.fetchAll(criteriaB, {
          cap: request.cap,
          signal: controller.signal,
          onProgress: (n, total) => {
            this.fetchedB.set(n);
            this.totalB.set(total);
          },
        }),
      ]);
      if (controller.signal.aborted) {
        this.phase.set('cancelled');
        return;
      }

      this.totalA.set(sideA.total);
      this.totalB.set(sideB.total);
      this.truncatedA.set(sideA.truncated);
      this.truncatedB.set(sideB.truncated);
      this.phase.set('comparing');

      const identity = request.mode === 'identity' ? request.identity : [];
      const options = { identity };
      const recordsA = sideA.rows.map((row) => record(row, options));
      const recordsB = sideB.rows.map((row) => record(row, options));
      this.comparison.set(compareChannels(recordsA, recordsB, options));
      this.phase.set('done');
    } catch (err) {
      this.phase.set('error');
      this.error.set(messageOf(err));
    } finally {
      if (this.controller === controller) this.controller = null;
    }
  }
}

function record(row: Hl7MessageRow, options: { identity: readonly string[] }): ChannelRecord {
  return toRecord(row.message as Record<string, unknown>, options);
}

/** `response[0].observation[12].obx.units` -> `response[].observation[].obx.units`. */
function collapseIndices(path: string): string {
  return path.replace(/\[\d+\]/g, '[]');
}
