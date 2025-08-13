import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import httpMocks from "node-mocks-http";
import handler from "../api/scraper/run.js";

beforeEach(() => {
  process.env.OPENAI_API_KEY = "test-key";
});

afterEach(() => {
  vi.resetAllMocks();
  delete process.env.APIFY_TOKEN;
  delete process.env.BROWSERLESS_KEY;
});

describe("/api/scraper/run", () => {
  it("uses Apify when token available", async () => {
    process.env.APIFY_TOKEN = "apify";
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ result: "apify-data" })
    });

    const req = httpMocks.createRequest({
      method: "POST",
      body: { url: "http://example.com" }
    });
    const res = httpMocks.createResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res._getData());
    expect(body.success).toBe(true);
    expect(body.data.provider).toBe("apify");
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0][0]).toContain("apify");
  });

  it("falls back to Browserless when Apify fails", async () => {
    process.env.APIFY_TOKEN = "apify";
    process.env.BROWSERLESS_KEY = "browserless";
    global.fetch = vi
      .fn()
      .mockRejectedValueOnce(new Error("Apify error"))
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ result: "browserless-data" })
      });

    const req = httpMocks.createRequest({
      method: "POST",
      body: { url: "http://example.com" }
    });
    const res = httpMocks.createResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res._getData());
    expect(body.success).toBe(true);
    expect(body.data.provider).toBe("browserless");
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch.mock.calls[1][0]).toContain("browserless");
  });
});
