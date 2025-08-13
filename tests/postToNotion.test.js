import { describe, it, expect, beforeEach, vi } from "vitest";
import httpMocks from "node-mocks-http";
import { postToNotion } from "../helpers/postToNotion.js";

beforeEach(() => {
  process.env.ZANTARA_API_KEY = "key";
});

describe("postToNotion", () => {
  it("returns data on success", async () => {
    const mockRes = { success: true, data: { id: "123" } };
    global.fetch = vi.fn().mockResolvedValue({
      status: 200,
      json: () => Promise.resolve(mockRes)
    });

    const req = httpMocks.createRequest({ headers: { "x-forwarded-for": "1.1.1.1" } });
    const result = await postToNotion({ request: req, summary: "test" });

    expect(result).toEqual({ success: true, data: mockRes.data });
    expect(fetch).toHaveBeenCalledWith(
      "/api/notion-write",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: `Bearer ${process.env.ZANTARA_API_KEY}`
        })
      })
    );
  });

  it("returns error on unauthorized", async () => {
    const mockRes = { success: false, error: "Unauthorized" };
    global.fetch = vi.fn().mockResolvedValue({
      status: 401,
      json: () => Promise.resolve(mockRes)
    });

    const req = httpMocks.createRequest();
    const result = await postToNotion({ request: req, summary: "test" });

    expect(result).toEqual({ success: false, error: mockRes.error });
  });
});
