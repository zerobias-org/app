import { describe, expect, it } from "vitest";
import { splitUuidList } from "./uuid-list";

describe("splitUuidList", () => {
  it("returns an empty array for blank input", () => {
    expect(splitUuidList("")).toEqual([]);
    expect(splitUuidList("   ")).toEqual([]);
    expect(splitUuidList(" , , ")).toEqual([]);
  });

  it("splits on commas and trims", () => {
    expect(splitUuidList("a, b ,c")).toEqual(["a", "b", "c"]);
  });

  it("splits on arbitrary whitespace and newlines (pasted lists)", () => {
    expect(splitUuidList("a b\nc\td")).toEqual(["a", "b", "c", "d"]);
    expect(splitUuidList("a,\n  b")).toEqual(["a", "b"]);
  });

  it("de-duplicates while preserving first-seen order", () => {
    expect(splitUuidList("b, a, b, c, a")).toEqual(["b", "a", "c"]);
  });
});
