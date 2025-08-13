import { describe, it, expect, beforeEach, vi } from "vitest";
import httpMocks from "node-mocks-http";
import handler from "../api/visaOracle.js";

beforeEach(() => {
  process.env.OPENAI_API_KEY = "test";
  vi.resetAllMocks();
});

describe("visaOracle handler", () => {
  it("returns 403 for blocked requester", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: { prompt: "hi", requester: "Ruslantara" }
    });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(403);
  });

  it("returns 200 on success", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ result: "ok" })
    });
    const req = httpMocks.createRequest({
      method: "POST",
      body: { prompt: "hi", requester: "user" }
    });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res._getData()).success).toBe(true);
  });
});
