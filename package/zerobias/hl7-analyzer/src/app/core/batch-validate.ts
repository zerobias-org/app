import { inject, Injectable, signal } from '@angular/core';

import {
  ENVELOPE_SCHEMA_ID,
  Hl7Api,
  type Hl7MessageRow,
  type ValidationResult,
} from './hl7-api';
import type { Hl7SearchCriteria } from './hl7-filter';
import { Hl7SchemaService, normalizeError, type ResolvedError } from './hl7-schema';

/**
 * Validates a whole search result set and rolls the findings up by *defect*, not by message.
 *
 * Validating one message answers "is this one good?". That is the wrong question for a feed: a
 * misconfigured sender produces the same defect in every message it sends, so a list of 400 invalid
 * messages is really one finding repeated 400 times. The rollup groups by the error with its array
 * indices collapsed (`normalizeError`), which folds "60 OBX repeats each missing OBX-3" into a
 * single row with a count of 60 — and folds it again across every message that shares it.
 *
 * Cost is the reason for the cap. Each message costs one `ops/validate` round trip, so a run over a
 * busy day is thousands of calls; the page offers 50/200/1000 and says what it sampled.
 */

/** How many validations are in flight at once. Enough to hide latency, few enough to be polite. */
const CONCURRENCY = 6;

export interface BatchRowResult {
  readonly controlId: string;
  readonly receivedAt: string;
  readonly sourcePort: string;
  readonly messageStructure: string;
  readonly valid: boolean;
  /** False when the stored JSON and the re-parsed ER7 disagree — a defect in its own right. */
  readonly agree: boolean;
  readonly errors: readonly string[];
  readonly schemaId: string;
  /**
   * False when the receiver never parsed this message (no schema for its structure), so it was
   * checked against the receipt envelope instead. Such a result says nothing about HL7 conformance
   * and is counted on its own, never as valid or invalid.
   */
  readonly materialized: boolean;
}

/** One defect, with every message that exhibits it. */
export interface ReasonGroup {
  /** The index-collapsed error — the grouping key. */
  readonly key: string;
  /** Total occurrences, counting repeats within a message. */
  readonly count: number;
  /** Distinct messages affected. */
  readonly messages: number;
  /** Control ids, capped for display. */
  readonly examples: readonly string[];
  /** Schema-resolved detail for the representative occurrence, when it could be resolved. */
  readonly resolved?: ResolvedError;
}

export type BatchPhase = 'idle' | 'fetching' | 'validating' | 'done' | 'error' | 'cancelled';

@Injectable()
export class BatchValidator {
  private readonly api = inject(Hl7Api);
  private readonly schemas = inject(Hl7SchemaService);

  readonly phase = signal<BatchPhase>('idle');
  readonly error = signal<string | null>(null);
  /** Messages validated so far / to validate. */
  readonly done = signal(0);
  readonly planned = signal(0);
  /** Total matching the filter — larger than `planned` when the cap bit. */
  readonly matching = signal(0);
  readonly truncated = signal(false);
  readonly results = signal<readonly BatchRowResult[]>([]);
  readonly reasons = signal<readonly ReasonGroup[]>([]);
  /** Messages whose validation call itself failed — reported rather than counted as valid. */
  readonly failed = signal(0);

  /** Per-message verdict, for the search table's validity column. Keyed by control id. */
  readonly verdicts = signal<ReadonlyMap<string, BatchRowResult>>(new Map());

  private controller: AbortController | null = null;

  get running(): boolean {
    return this.phase() === 'fetching' || this.phase() === 'validating';
  }

  cancel(): void {
    this.controller?.abort();
  }

  reset(): void {
    this.cancel();
    this.phase.set('idle');
    this.error.set(null);
    this.done.set(0);
    this.planned.set(0);
    this.matching.set(0);
    this.truncated.set(false);
    this.failed.set(0);
    this.results.set([]);
    this.reasons.set([]);
    this.verdicts.set(new Map());
  }

  /** Validate every message matching `criteria`, up to `cap`. */
  async run(criteria: Hl7SearchCriteria, cap: number): Promise<void> {
    this.reset();
    const controller = new AbortController();
    this.controller = controller;
    this.phase.set('fetching');

    try {
      const page = await this.api.fetchAll(criteria, {
        cap,
        pageSize: 200,
        signal: controller.signal,
        onProgress: (fetched) => this.done.set(fetched),
      });
      if (controller.signal.aborted) return this.finishCancelled();

      this.matching.set(page.total);
      this.truncated.set(page.truncated);
      this.planned.set(page.rows.length);
      this.done.set(0);
      this.phase.set('validating');

      const results: BatchRowResult[] = [];
      let failed = 0;
      await pool(page.rows, CONCURRENCY, controller.signal, async (row) => {
        try {
          const result = await this.api.validate(row.controlId);
          results.push(toRowResult(row, result));
        } catch {
          // A message we could not check is not a message that passed — count it separately so the
          // summary's "valid" number never absorbs an unknown.
          failed += 1;
        } finally {
          this.done.update((n) => n + 1);
        }
      });
      if (controller.signal.aborted) {
        this.publish(results, failed);
        return this.finishCancelled();
      }

      this.publish(results, failed);
      await this.rollup(results);
      this.phase.set('done');
    } catch (err) {
      this.phase.set('error');
      this.error.set(err instanceof Error ? err.message : String(err));
    } finally {
      if (this.controller === controller) this.controller = null;
    }
  }

  private finishCancelled(): void {
    this.phase.set('cancelled');
  }

  private publish(results: readonly BatchRowResult[], failed: number): void {
    const sorted = [...results].sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));
    this.results.set(sorted);
    this.failed.set(failed);
    this.verdicts.set(new Map(sorted.map((r) => [r.controlId, r])));
  }

  /** Group the errors by defect and resolve one representative of each against the schema. */
  private async rollup(results: readonly BatchRowResult[]): Promise<void> {
    interface Bucket {
      count: number;
      messages: Set<string>;
      sample: string;
      schemaId: string;
    }
    const buckets = new Map<string, Bucket>();
    for (const result of results) {
      for (const raw of result.errors) {
        const key = normalizeError(raw);
        const bucket = buckets.get(key) ?? {
          count: 0,
          messages: new Set<string>(),
          sample: raw,
          schemaId: result.schemaId,
        };
        bucket.count += 1;
        bucket.messages.add(result.controlId);
        buckets.set(key, bucket);
      }
    }

    const groups = await Promise.all(
      [...buckets.entries()].map(async ([key, bucket]) => {
        const resolved = bucket.schemaId
          ? await this.schemas.resolve(bucket.sample, bucket.schemaId).catch(() => undefined)
          : undefined;
        return {
          key,
          count: bucket.count,
          messages: bucket.messages.size,
          examples: [...bucket.messages].slice(0, 20),
          resolved,
        } satisfies ReasonGroup;
      }),
    );
    groups.sort((a, b) => b.messages - a.messages || b.count - a.count || a.key.localeCompare(b.key));
    this.reasons.set(groups);
  }
}

function toRowResult(row: Hl7MessageRow, result: ValidationResult): BatchRowResult {
  const schemaId = result.schemaId ?? '';
  const materialized = row.materialized && schemaId !== ENVELOPE_SCHEMA_ID;
  // The stored body is what every other view in this app reads, so its errors are the ones a user
  // can act on; a rematerialization disagreement is surfaced separately as `agree`.
  return {
    controlId: row.controlId,
    receivedAt: row.receivedAt,
    sourcePort: row.sourcePort,
    messageStructure: row.messageStructure,
    valid: result.stored?.valid ?? false,
    agree: result.repsAgree ?? true,
    errors: materialized ? (result.stored?.errors ?? []) : [],
    schemaId,
    materialized,
  };
}

/** Run `worker` over `items`, at most `limit` at a time, stopping early if aborted. */
async function pool<T>(
  items: readonly T[],
  limit: number,
  signal: AbortSignal,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  let next = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    for (;;) {
      if (signal.aborted) return;
      const index = next++;
      if (index >= items.length) return;
      await worker(items[index]);
    }
  });
  await Promise.all(runners);
}
