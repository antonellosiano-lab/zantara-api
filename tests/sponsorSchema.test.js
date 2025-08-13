import { describe, it, expect } from "vitest";
import { sponsorSchema } from "../constants/sponsorSchema.js";

describe("sponsorSchema", () => {
  it("validates correct data", () => {
    const valid = {
      kbli: ["A"],
      fit_for: ["B"],
      gaps: ["C"],
      actions: ["D"]
    };
    expect(() => sponsorSchema.parse(valid)).not.toThrow();
  });

  it("rejects invalid data", () => {
    const invalid = {
      kbli: "not array",
      fit_for: [],
      gaps: [],
      actions: []
    };
    expect(() => sponsorSchema.parse(invalid)).toThrow();
  });
});
