import { describe, it, expect } from "vitest";
import { listboxKeyAction } from "./listbox-nav";

describe("listboxKeyAction", () => {
  it("ArrowDown with nothing active enters at the first row", () => {
    expect(listboxKeyAction("ArrowDown", -1, 3)).toEqual({ type: "move", index: 0 });
  });

  it("ArrowDown advances and clamps at the last row (no wrap)", () => {
    expect(listboxKeyAction("ArrowDown", 0, 3)).toEqual({ type: "move", index: 1 });
    expect(listboxKeyAction("ArrowDown", 2, 3)).toEqual({ type: "move", index: 2 });
  });

  it("ArrowUp with nothing active enters at the last row", () => {
    expect(listboxKeyAction("ArrowUp", -1, 3)).toEqual({ type: "move", index: 2 });
  });

  it("ArrowUp retreats and clamps at the first row (no wrap)", () => {
    expect(listboxKeyAction("ArrowUp", 2, 3)).toEqual({ type: "move", index: 1 });
    expect(listboxKeyAction("ArrowUp", 0, 3)).toEqual({ type: "move", index: 0 });
  });

  it("Home/End jump to the first/last row", () => {
    expect(listboxKeyAction("Home", 2, 3)).toEqual({ type: "move", index: 0 });
    expect(listboxKeyAction("End", 0, 3)).toEqual({ type: "move", index: 2 });
  });

  it("Enter/Space select the active row", () => {
    expect(listboxKeyAction("Enter", 1, 3)).toEqual({ type: "select" });
    expect(listboxKeyAction(" ", 1, 3)).toEqual({ type: "select" });
  });

  it("Enter/Space with no active row is a no-op", () => {
    expect(listboxKeyAction("Enter", -1, 3)).toEqual({ type: "none" });
  });

  it("Escape and Tab close the list", () => {
    expect(listboxKeyAction("Escape", 1, 3)).toEqual({ type: "close" });
    expect(listboxKeyAction("Tab", 1, 3)).toEqual({ type: "close" });
  });

  it("empty list: Escape/Tab close, everything else is a no-op", () => {
    expect(listboxKeyAction("Escape", -1, 0)).toEqual({ type: "close" });
    expect(listboxKeyAction("Tab", -1, 0)).toEqual({ type: "close" });
    expect(listboxKeyAction("ArrowDown", -1, 0)).toEqual({ type: "none" });
  });

  it("unhandled keys are no-ops", () => {
    expect(listboxKeyAction("a", 1, 3)).toEqual({ type: "none" });
  });
});
