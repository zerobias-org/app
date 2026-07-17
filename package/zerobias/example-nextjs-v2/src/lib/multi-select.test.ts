import { describe, it, expect } from "vitest";
import { toggleValue, initialActiveIndex, triggerLabel } from "./multi-select";

describe("toggleValue", () => {
  it("appends a new id at the end", () => {
    expect(toggleValue(["a"], "b")).toEqual(["a", "b"]);
  });

  it("removes an already-selected id", () => {
    expect(toggleValue(["a", "b", "c"], "b")).toEqual(["a", "c"]);
  });

  it("adds to an empty selection", () => {
    expect(toggleValue([], "a")).toEqual(["a"]);
  });

  it("does not mutate the input array", () => {
    const input = ["a"];
    toggleValue(input, "b");
    expect(input).toEqual(["a"]);
  });
});

describe("initialActiveIndex", () => {
  const ids = ["draft", "published", "active"];

  it("lands on the first selected option", () => {
    expect(initialActiveIndex(ids, ["active"])).toBe(2);
  });

  it("lands on the first of several selected, by list order not selection order", () => {
    expect(initialActiveIndex(ids, ["active", "draft"])).toBe(0);
  });

  it("lands on the top when nothing is selected", () => {
    expect(initialActiveIndex(ids, [])).toBe(0);
  });
});

describe("triggerLabel", () => {
  const labelOf = (id: string) =>
    ({ draft: "Draft", published: "Published" })[id] ?? null;

  it("shows the placeholder when empty", () => {
    expect(triggerLabel([], labelOf, "Any")).toBe("Any");
  });

  it("shows the single option's label when one is chosen", () => {
    expect(triggerLabel(["draft"], labelOf, "Any")).toBe("Draft");
  });

  it("falls back to '1 selected' when the single label is not plain text", () => {
    expect(triggerLabel(["unknown"], labelOf, "Any")).toBe("1 selected");
  });

  it("shows the count when more than one is chosen", () => {
    expect(triggerLabel(["draft", "published"], labelOf, "Any")).toBe("2 selected");
  });
});
