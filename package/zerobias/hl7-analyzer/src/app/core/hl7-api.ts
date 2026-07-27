import { inject, Injectable } from '@angular/core';
import { SortDirection } from '@zerobias-org/hub-sdk-interface-dataproducer/model';

import { buildFilter, type Hl7SearchCriteria } from './hl7-filter';
import { Hl7TargetService } from './hl7-target.service';

/**
 * The HL7 receiver's object tree, as this app uses it. Every call goes through the DataProducer SDK
 * (`getCollectionsApi` / `getFunctionsApi` / `getObjectsApi`), so the module's OpenAPI contract is
 * the only thing we depend on — no hand-built URLs.
 *
 *   /hl7-v2-receiver/messages     collection — every message, filterable (see hl7-filter.ts)
 *   /hl7-v2-receiver/by-port      container  — one child per receiving port  (the "channels")
 *   /hl7-v2-receiver/by-type      container  — one child per message structure
 *   /hl7-v2-receiver/by-version   container  — one child per HL7 version
 *   /hl7-v2-receiver/by-sender    container  — one child per MSH-3 sending application
 *   /hl7-v2-receiver/ops/er7      function   — the raw wire text for one message
 *   /hl7-v2-receiver/ops/validate function   — schema validation for one message
 *
 * The `by-*` containers exist only to populate the pickers: their children carry the distinct facet
 * values and (usually) a count. All actual searching is one filtered query against `messages`,
 * because a single flat filter can express every axis at once — port AND type AND date — which the
 * per-facet collections cannot.
 *
 * Note the `/stats` document is advertised by the module but not fetchable (`getDocumentData` fails
 * with "Unknown API class: DocumentsApi" on 1.2.3), so nothing here depends on it.
 */

const ROOT = '/hl7-v2-receiver';
export const MESSAGES = `${ROOT}/messages`;
export const OPS_ER7 = `${ROOT}/ops/er7`;
export const OPS_VALIDATE = `${ROOT}/ops/validate`;

/** The `by-*` containers, keyed by the criteria field each one populates. */
export const FACETS = {
  sourcePort: `${ROOT}/by-port`,
  messageStructure: `${ROOT}/by-type`,
  hl7Version: `${ROOT}/by-version`,
  sendingApp: `${ROOT}/by-sender`,
} as const;

export type FacetKind = keyof typeof FACETS;

export interface FacetValue {
  /** The value to filter by — this is also the child's display name. */
  readonly value: string;
  /** Message count, when the module reports one (containers with sub-levels don't). */
  readonly count?: number;
}

/**
 * A message as the collection returns it: the full materialized body (`msh` plus the structure's
 * own top-level groups, which differ by version), with the envelope fields alongside.
 */
export interface Hl7Message {
  readonly controlId: string;
  readonly receivedAt: string;
  readonly sourcePort?: string;
  readonly status?: string;
  readonly msh?: Record<string, unknown>;
  readonly [key: string]: unknown;
}

/** A message flattened to the columns the search table shows. `message` keeps the full body. */
export interface Hl7MessageRow {
  readonly controlId: string;
  readonly receivedAt: string;
  readonly sourcePort: string;
  readonly status: string;
  readonly messageStructure: string;
  readonly hl7Version: string;
  readonly sendingApp: string;
  readonly sendingFacility: string;
  /**
   * False when the receiver stored only its index attributes — see `MATERIALIZED_KEY`. An
   * unmaterialized message has no segments to validate or compare, so both tools have to say so
   * rather than draw conclusions from an empty body.
   */
  readonly materialized: boolean;
  readonly message: Hl7Message;
}

export interface Hl7Page {
  readonly rows: readonly Hl7MessageRow[];
  /** Total matching the filter, from the paging headers — not just this page. */
  readonly count: number;
}

/** What `ops/er7` returns. */
export interface Er7Result {
  readonly controlId: string;
  readonly hl7Version?: string;
  readonly messageStructure?: string;
  readonly sourcePort?: string;
  readonly er7: string;
}

/** One side of a validation — the module checks the stored body and a re-parse of the wire text. */
export interface ValidationSide {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly schemaId?: string;
}

/** What `ops/validate` returns. */
export interface ValidationResult {
  readonly controlId: string;
  /** The message schema the body was checked against, e.g. `schema:table:hl7v2.v23.ORU_R01`. */
  readonly schemaId: string;
  /** Validation of the stored (materialized) message. */
  readonly stored: ValidationSide;
  /** Validation of the message re-parsed from its ER7 text. */
  readonly rematerialized: ValidationSide;
  /**
   * True when both representations produce the same verdict. A false here is a finding in itself:
   * the stored JSON and the wire text disagree, so one of them was built wrong.
   */
  readonly repsAgree: boolean;
}

@Injectable({ providedIn: 'root' })
export class Hl7Api {
  private readonly target = inject(Hl7TargetService);

  /** Distinct values for one facet, for the pickers. */
  async facet(kind: FacetKind): Promise<readonly FacetValue[]> {
    const client = await this.target.producer();
    const results = await client.getObjectsApi().getChildren(FACETS[kind], 1, 500);
    return results.items
      .map((o) => ({ value: o.name, count: o.collectionSize }))
      .sort((a, b) => a.value.localeCompare(b.value));
  }

  /** One page of messages matching the criteria, newest first unless told otherwise. */
  async search(
    criteria: Hl7SearchCriteria,
    pageNumber = 1,
    pageSize = 50,
    sortBy: readonly string[] = ['receivedAt'],
    descending = true,
  ): Promise<Hl7Page> {
    const client = await this.target.producer();
    const filter = buildFilter(criteria);
    const results = await client
      .getCollectionsApi()
      .searchCollectionElements(
        MESSAGES,
        pageNumber,
        pageSize,
        filter || undefined,
        [...sortBy],
        sortBy.map(() => (descending ? SortDirection.Desc : SortDirection.Asc)),
      );
    const rows = results.items.map((item) => toRow(item as Hl7Message));
    // The receiver answers a filter that matched nothing with `count: -1`, not `0` — verified live
    // on `(status=ACKED)` and any structure that has no messages. Passing that through puts
    // "-1 matching" in front of a user; it means "none".
    const count = results.count ?? rows.length;
    return { rows, count: count < 0 ? rows.length : count };
  }

  /** One message, by MSH-10. The collection's primary key is the control id. */
  async get(controlId: string): Promise<Hl7Message> {
    const client = await this.target.producer();
    const element = await client.getCollectionsApi().getCollectionElement(MESSAGES, controlId);
    return element as unknown as Hl7Message;
  }

  /** The raw ER7 wire text for a message. */
  async er7(controlId: string): Promise<Er7Result> {
    const client = await this.target.producer();
    const result = await client
      .getFunctionsApi()
      .invokeFunction(OPS_ER7, { elementKey: controlId as unknown as object });
    return result as unknown as Er7Result;
  }

  /** Validate one message against its HL7 schema. */
  async validate(controlId: string): Promise<ValidationResult> {
    const client = await this.target.producer();
    const result = await client
      .getFunctionsApi()
      .invokeFunction(OPS_VALIDATE, { elementKey: controlId as unknown as object });
    return result as unknown as ValidationResult;
  }

  /**
   * Every message matching the criteria, up to `cap`.
   *
   * The busiest channel holds ~12k messages at a few KB each, so an uncapped fetch is tens of MB and
   * a long wait. `cap` bounds that, and the caller is told whether it truncated — the channel
   * analyzer has to say so, because "absent from B" is not a sound conclusion when B was cut short.
   */
  async fetchAll(
    criteria: Hl7SearchCriteria,
    options: {
      cap?: number;
      pageSize?: number;
      onProgress?: (fetched: number, total: number) => void;
      signal?: AbortSignal;
    } = {},
  ): Promise<{ rows: readonly Hl7MessageRow[]; total: number; truncated: boolean }> {
    const cap = options.cap ?? 5000;
    const pageSize = options.pageSize ?? 200;
    const rows: Hl7MessageRow[] = [];
    let total = 0;
    let pageNumber = 1;

    for (;;) {
      if (options.signal?.aborted) break;
      const page = await this.search(criteria, pageNumber, pageSize);
      total = page.count;
      rows.push(...page.rows);
      options.onProgress?.(rows.length, Math.min(total, cap));
      if (page.rows.length < pageSize) break; // last page
      if (rows.length >= cap) break;
      if (rows.length >= total) break;
      pageNumber += 1;
    }

    const kept = rows.slice(0, cap);
    return { rows: kept, total, truncated: kept.length < total };
  }
}

/**
 * Whether an element carries a materialized body.
 *
 * The receiver returns two different shapes from the same collection. When it has a schema for the
 * structure it stores the parsed message (`msh` plus the structure's groups). When it doesn't —
 * RDE_O03 on 2.2, in the live UAT feed — it keeps only the twelve indexed attributes
 * (`messageCode`, `triggerEvent`, `patientFamilyName`, …) and no `msh`. The ER7 text is still
 * there either way, so the wire message is never lost; only the parsed view is.
 *
 * `msh` is the marker because it's the one segment every materialized message has.
 */
export const MATERIALIZED_KEY = 'msh';

/**
 * The schema `ops/validate` falls back to for an unmaterialized message. It describes the receipt
 * envelope, not HL7, so every index attribute comes back as "undeclared property" — eight findings
 * that say nothing about the message on the wire. Both tools check for this id and report "not
 * parsed" instead of parading those as defects.
 */
export const ENVELOPE_SCHEMA_ID = 'schema:shared:hl7v2.message-envelope';

/** Project a message onto the search columns, from either element shape. */
export function toRow(message: Hl7Message): Hl7MessageRow {
  const raw = message as Record<string, unknown>;
  const materialized = isRecord(raw[MATERIALIZED_KEY]);
  const msh = (materialized ? raw[MATERIALIZED_KEY] : {}) as Record<string, unknown>;
  return {
    controlId: String(message.controlId ?? ''),
    receivedAt: String(message.receivedAt ?? ''),
    sourcePort: String(message.sourcePort ?? ''),
    status: String(message.status ?? ''),
    messageStructure: materialized ? messageStructureOf(msh) : indexStructureOf(raw),
    hl7Version: materialized ? versionOf(msh) : '',
    sendingApp: hd(msh['sendingApplication']),
    // The index projection carries MSH-4 as a bare string; the parsed one as an HD composite.
    sendingFacility: materialized ? hd(msh['sendingFacility']) : String(raw['sendingFacility'] ?? ''),
    materialized,
    message,
  };
}

/**
 * MSH-9. The materialized shape follows the version: 2.3 carries `{ messageType, triggerEvent }`,
 * later versions add an explicit `messageStructure`. Prefer the explicit one when it's there.
 */
function messageStructureOf(msh: Record<string, unknown>): string {
  const type = msh['messageType'];
  if (!isRecord(type)) return String(type ?? '');
  const explicit = type['messageStructure'];
  if (explicit) return String(explicit);
  const code = type['messageType'] ?? type['messageCode'] ?? '';
  const trigger = type['triggerEvent'] ?? '';
  return trigger ? `${code}_${trigger}` : String(code);
}

/** The same field off the index projection, which splits MSH-9 into two flat attributes. */
function indexStructureOf(raw: Record<string, unknown>): string {
  const code = String(raw['messageCode'] ?? '');
  const trigger = String(raw['triggerEvent'] ?? '');
  if (!code) return '';
  return trigger ? `${code}_${trigger}` : code;
}

/**
 * MSH-12. A bare string on 2.3, the VID composite `{ versionID }` from 2.4 on — rendering the
 * composite straight into the column is where `[object Object]` came from.
 */
function versionOf(msh: Record<string, unknown>): string {
  const version = msh['versionID'];
  if (isRecord(version)) return String(version['versionID'] ?? '');
  return String(version ?? '');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * An HD (hierarchic designator) field — MSH-3/MSH-4. Sometimes a bare string, sometimes
 * `{ namespaceID }`, depending on the version and what the sender populated.
 */
function hd(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return String((value as Record<string, unknown>)['namespaceID'] ?? '');
  return String(value);
}
