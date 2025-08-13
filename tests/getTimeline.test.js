import { describe, it, expect, beforeEach, vi } from "vitest";
import { getTimeline } from "../helpers/getTimeline.js";

beforeEach(() => {
  process.env.BASE_URL = "http://localhost";
  vi.resetAllMocks();
});

describe("getTimeline", () => {
  it("fetches timeline and validates steps", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({
        steps: [
          { id: "1", title: "Start", date: "2025-01-01", status: "done" }
        ]
      })
    });

    const data = await getTimeline("E23A");

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost/index/timeline/E23A",
      { method: "GET" }
    );
    expect(data.steps.length).toBe(1);
  });

  it("throws error on invalid step", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ steps: [ { id: 1 } ] })
    });

    await expect(getTimeline("E23A")).rejects.toThrow("Invalid step structure");
  });
});
