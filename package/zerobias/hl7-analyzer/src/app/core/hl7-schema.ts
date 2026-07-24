import { inject, Injectable } from '@angular/core';
import type { Property, Schema } from '@zerobias-org/hub-sdk-interface-dataproducer/model';

import { Hl7TargetService } from './hl7-target.service';

/**
 * Turns a validation error into something a human can act on: which HL7 field it is about, and what
 * the schema actually says about that field.
 *
 * `ops/validate` reports errors as JSON dot-paths into the materialized message:
 *
 *   response[0].order_observation[0].observation[3].obx.observationIdentifier: missing required property
 *
 * That is precise but unreadable to anyone who thinks in HL7 — they want "OBX-3 (the 4th OBX)".
 * The bridge is `getSchema`: a segment's type schema lists its properties **in HL7 field order**, so
 * the index of `observationIdentifier` in `schema:type:hl7v2.v23.OBX` is its field ordinal — 3.
 * Verified against the live receiver: setIDOBX=OBX-1, valueType=OBX-2, observationIdentifier=OBX-3.
 *
 * The schema id comes from the validate response itself (`schema:table:hl7v2.v23.ORU_R01`), so the
 * version slug is never guessed — swapping `:table:` for `:type:` and the message structure for the
 * segment name gives the segment schema for exactly the version that was validated.
 */

/** A validation error, split and resolved as far as the schema allows. */
export interface ResolvedError {
  /** The raw string as the module reported it — always shown, so nothing is lost in translation. */
  readonly raw: string;
  /** JSON path into the materialized message, e.g. `response[0]...obx.observationIdentifier`. */
  readonly path: string;
  /** The reason text, e.g. `missing required property`. */
  readonly reason: string;
  /** Path of the segment that owns this error, e.g. `response[0]...observation[3].obx`. */
  readonly segmentPath: string;
  /** Segment id, upper case — `OBX`. */
  readonly segmentName: string;
  /** The offending property name, or undefined when the error is about the segment as a whole. */
  readonly propertyName?: string;
  /** HL7 field ordinal, when the schema could resolve it — 3 for OBX-3. */
  readonly ordinal?: number;
  /** The schema's own record for that property: dataType, required, description. */
  readonly property?: Property;
  /** The schema the ordinal came from, cited in the UI so the claim is checkable. */
  readonly schemaId?: string;
  /** `OBX-3` when resolved, else the property name, else the segment name. */
  readonly label: string;
}

/** `schema:table:hl7v2.v23.ORU_R01` + `OBX` -> `schema:type:hl7v2.v23.OBX`. */
export function segmentSchemaId(messageSchemaId: string, segmentName: string): string | null {
  const asType = messageSchemaId.replace(':table:', ':type:');
  const lastDot = asType.lastIndexOf('.');
  if (lastDot === -1 || !asType.startsWith('schema:type:')) return null;
  return `${asType.slice(0, lastDot + 1)}${segmentName.toUpperCase()}`;
}

/** Split `path: reason` at the first `: ` — reasons themselves may contain colons. */
export function splitError(raw: string): { path: string; reason: string } {
  const at = raw.indexOf(': ');
  if (at === -1) return { path: '', reason: raw };
  return { path: raw.slice(0, at), reason: raw.slice(at + 2) };
}

/**
 * Normalize an error for counting: collapse every array index so the same defect repeated across
 * 60 observations reads as one finding.
 *
 *   response[0].order_observation[0].observation[3].obx.observationIdentifier
 *   -> response[].order_observation[].observation[].obx.observationIdentifier
 */
export function normalizeError(raw: string): string {
  return raw.replace(/\[\d+\]/g, '[]');
}

@Injectable({ providedIn: 'root' })
export class Hl7SchemaService {
  private readonly target = inject(Hl7TargetService);

  /**
   * Schemas are immutable for a given id, and a batch validation resolves the same handful of
   * segment schemas thousands of times — so cache the promise, not just the value, and concurrent
   * resolutions of the same segment share one round trip.
   */
  private readonly cache = new Map<string, Promise<Schema | null>>();

  /** Fetch a schema through the DataProducer SDK. Resolves to null if the module doesn't have it. */
  getSchema(schemaId: string): Promise<Schema | null> {
    const hit = this.cache.get(schemaId);
    if (hit) return hit;
    const promise = (async () => {
      try {
        const client = await this.target.producer();
        return await client.getSchemasApi().getSchema(schemaId);
      } catch {
        // A missing segment schema costs us the ordinal, not the error — resolve() degrades.
        return null;
      }
    })();
    this.cache.set(schemaId, promise);
    return promise;
  }

  /** Drop cached schemas — call when the target changes, since versions may differ. */
  clear(): void {
    this.cache.clear();
  }

  /** Resolve one validation error against the schema that produced it. */
  async resolve(raw: string, messageSchemaId: string): Promise<ResolvedError> {
    const { path, reason } = splitError(raw);
    const parts = path.split('.');
    const last = parts[parts.length - 1] ?? '';
    // A 3-character tail is the segment itself (`...order_observation[0].obr: ...`); anything else
    // is a property of the segment named just before it.
    const isSegmentLevel = stripIndex(last).length === 3;
    const segmentPath = isSegmentLevel ? path : parts.slice(0, -1).join('.');
    const segmentName = stripIndex(
      isSegmentLevel ? last : (parts[parts.length - 2] ?? ''),
    ).toUpperCase();
    const propertyName = isSegmentLevel ? undefined : last;

    const base: ResolvedError = {
      raw,
      path,
      reason,
      segmentPath,
      segmentName,
      propertyName,
      label: propertyName ?? segmentName,
    };
    if (!propertyName || segmentName.length !== 3) return base;

    const schemaId = segmentSchemaId(messageSchemaId, segmentName);
    if (!schemaId) return base;
    const schema = await this.getSchema(schemaId);
    if (!schema) return { ...base, schemaId };

    const index = schema.properties.findIndex((p) => p.name === propertyName);
    if (index === -1) return { ...base, schemaId };
    return {
      ...base,
      schemaId,
      ordinal: index + 1, // property order IS field order
      property: schema.properties[index],
      label: `${segmentName}-${index + 1}`,
    };
  }
}

/** `observation[3]` -> `observation`. */
function stripIndex(component: string): string {
  const at = component.indexOf('[');
  return at === -1 ? component : component.slice(0, at);
}
