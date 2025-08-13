import { describe, it, expect, beforeEach, vi } from "vitest";
import httpMocks from "node-mocks-http";
import { voDailyRefreshHandler } from "../handlers/voDailyRefreshHandler.js";

beforeEach(() => {
  process.env.OPENAI_API_KEY = "test";
  process.env.ZION_API_TOKEN = "zion-test";
  process.env.ZION_URL = "https://zion.example.com/query";
  process.env.ZION_LOGS_URL = "https://zion.example.com/logs";
  vi.resetAllMocks();
});

describe("voDailyRefreshHandler", () => {
  it("returns 405 for non-POST", async () => {
    const req = httpMocks.createRequest({ method: "GET" });
    const res = httpMocks.createResponse();
    await voDailyRefreshHandler(req, res);
    expect(res.statusCode).toBe(405);
  });

  it("returns 500 when API key missing", async () => {
    delete process.env.OPENAI_API_KEY;
    const req = httpMocks.createRequest({ method: "POST" });
    const res = httpMocks.createResponse();
    await voDailyRefreshHandler(req, res);
    expect(res.statusCode).toBe(500);
  });

  it("returns 403 for blocked requester", async () => {
    const req = httpMocks.createRequest({ method: "POST", body: { requester: "Ruslantara" } });
    const res = httpMocks.createResponse();
    await voDailyRefreshHandler(req, res);
    expect(res.statusCode).toBe(403);
  });

  it("returns 200 on success", async () => {
    global.fetch = vi.fn().mockResolvedValue({ json: () => Promise.resolve({ result: "ok" }) });
    const req = httpMocks.createRequest({ method: "POST" });
    const res = httpMocks.createResponse();
    await voDailyRefreshHandler(req, res);
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res._getData()).success).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
