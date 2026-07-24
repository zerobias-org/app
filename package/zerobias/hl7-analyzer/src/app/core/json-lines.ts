/**
 * Pretty-print JSON as lines that know their own path.
 *
 * `JSON.stringify(value, null, 2)` gives the same text but throws the structure away, and the
 * validation errors we need to paint onto it are *paths* — `response[0].observation[3].obx.setIDOBX`.
 * Matching those against rendered text with a regex means guessing at nesting, which goes wrong on
 * exactly the repeating groups where HL7 errors live. Emitting the path alongside each line makes
 * the lookup exact.
 *
 * The output is byte-for-byte what `JSON.stringify(value, null, indent)` produces (the pieces are
 * `JSON.stringify`ed individually), so nothing about the message is lost or reformatted.
 */

export interface JsonLine {
  /** The line text, already indented. */
  readonly text: string;
  /**
   * Path of the value this line belongs to, in the same notation the validator uses. `''` for the
   * root braces. A container contributes its path to both its opening and closing line.
   */
  readonly path: string;
  /** Nesting depth, for folding/indent-guide styling. */
  readonly depth: number;
}

export function jsonLines(value: unknown, indent = 2): readonly JsonLine[] {
  const lines: JsonLine[] = [];
  emit(value, '', undefined, 0, false, indent, lines);
  return lines;
}

function emit(
  value: unknown,
  path: string,
  key: string | undefined,
  depth: number,
  trailingComma: boolean,
  indent: number,
  out: JsonLine[],
): void {
  const pad = ' '.repeat(depth * indent);
  const prefix = key === undefined ? '' : `${JSON.stringify(key)}: `;
  const comma = trailingComma ? ',' : '';

  if (Array.isArray(value)) {
    if (value.length === 0) {
      out.push({ text: `${pad}${prefix}[]${comma}`, path, depth });
      return;
    }
    out.push({ text: `${pad}${prefix}[`, path, depth });
    value.forEach((item, i) => {
      emit(item, `${path}[${i}]`, undefined, depth + 1, i < value.length - 1, indent, out);
    });
    out.push({ text: `${pad}]${comma}`, path, depth });
    return;
  }

  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) {
      out.push({ text: `${pad}${prefix}{}${comma}`, path, depth });
      return;
    }
    out.push({ text: `${pad}${prefix}{`, path, depth });
    entries.forEach(([childKey, childValue], i) => {
      emit(
        childValue,
        path ? `${path}.${childKey}` : childKey,
        childKey,
        depth + 1,
        i < entries.length - 1,
        indent,
        out,
      );
    });
    out.push({ text: `${pad}}${comma}`, path, depth });
    return;
  }

  out.push({ text: `${pad}${prefix}${JSON.stringify(value ?? null)}${comma}`, path, depth });
}
