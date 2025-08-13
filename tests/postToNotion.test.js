import { describe, it, expect, beforeEach, vi } from "vitest";
import { postToNotion } from "../helpers/postToNotion.js";

beforeEach(() => {
  process.env.ZANTARA_API_KEY = "token";
});

describe("postToNotion", () => {
  it("returns data on success", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ result: "ok" }),
      headers: { get: vi.fn() }
    });
    global.fetch = mockFetch;
    const res = await postToNotion({ request: "r", summary: "s" });
    expect(res.success).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/notion-write",
      expect.objectContaining({
        method: "POST",
        headers: {
          Authorization: "Bearer token",
          "Content-Type": "application/json"
        }
      })
    );
  });

  it("returns error on unauthorized", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: "Unauthorized" }),
      headers: { get: vi.fn() }
    });
    global.fetch = mockFetch;
    const res = await postToNotion({ request: "r", summary: "s" });
    expect(res.success).toBe(false);
    expect(res.error).toBe("Unauthorized");
  });
});
