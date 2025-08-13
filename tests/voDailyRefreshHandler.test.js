import { describe, it, expect, beforeEach, vi } from "vitest";
import httpMocks from "node-mocks-http";
import { voDailyRefreshHandler } from "../handlers/voDailyRefreshHandler.js";

beforeEach(() => {
  process.env.OPENAI_API_KEY = "test";
  process.env.MAKE_API_TOKEN = "make-test";
  process.env.VO_DATABASE_ID = "db123";
});

describe("voDailyRefreshHandler", () => {
  it("returns 405 for non-POST", async () => {
    const req = httpMocks.createRequest({ method: "GET" });
    const res = httpMocks.createResponse();
    await voDailyRefreshHandler(req, res);
    expect(res.statusCode).toBe(405);
  });

  it("returns 400 when fields missing", async () => {
    const req = httpMocks.createRequest({ method: "POST" });
    const res = httpMocks.createResponse();
    await voDailyRefreshHandler(req, res);
    expect(res.statusCode).toBe(400);
  });

  it("returns 200 on success", async () => {
    global.fetch = vi.fn().mockResolvedValue({ json: () => Promise.resolve({ result: "ok" }) });
    const req = httpMocks.createRequest({ method: "POST", body: { webhook_url: "url", log_url: "log" } });
    const res = httpMocks.createResponse();
    await voDailyRefreshHandler(req, res);
    expect(res.statusCode).toBe(200);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
