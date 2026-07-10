import { describe, it, expect } from "vitest";
import { statusTone } from "./status-tone";

describe("statusTone", () => {
  it("maps healthy terminal statuses to a solid green dot", () => {
    expect(statusTone("up")).toEqual({ tone: "up", outlined: false, label: "UP" });
    expect(statusTone("ok").tone).toBe("up");
    expect(statusTone("active").outlined).toBe(false);
  });

  it("maps transitional statuses to an outlined (hollow) green dot", () => {
    expect(statusTone("standby")).toEqual({
      tone: "up",
      outlined: true,
      label: "STANDBY",
    });
    expect(statusTone("running").outlined).toBe(true);
  });

  it("maps failure statuses to red", () => {
    expect(statusTone("down").tone).toBe("down");
    expect(statusTone("error").tone).toBe("down");
    expect(statusTone("failed").outlined).toBe(false);
  });

  it("maps degraded/waiting to amber and provisioning/review to blue", () => {
    expect(statusTone("pending").tone).toBe("warn");
    expect(statusTone("draft").tone).toBe("info");
    expect(statusTone("in_progress")).toEqual({
      tone: "info",
      outlined: true,
      label: "IN PROGRESS",
    });
  });

  it("is case-insensitive on the tone lookup", () => {
    expect(statusTone("UP").tone).toBe("up");
    expect(statusTone("StandBy").outlined).toBe(true);
  });

  it("falls back to neutral for unknown statuses but still formats the label", () => {
    expect(statusTone("banana").tone).toBe("neutral");
    expect(statusTone("needs_data")).toEqual({
      tone: "neutral",
      outlined: false,
      label: "NEEDS DATA",
    });
  });

  it("handles a missing status", () => {
    expect(statusTone(undefined)).toEqual({
      tone: "neutral",
      outlined: false,
      label: "UNKNOWN",
    });
  });
});
