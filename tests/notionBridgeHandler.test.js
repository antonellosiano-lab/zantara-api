import { describe, it, expect, beforeEach, vi } from "vitest";
import httpMocks from "node-mocks-http";
import handler from "../api/notion-bridge.js";

beforeEach(() => {
  process.env.OPENAI_API_KEY = "test";
  process.env.NOTION_WRITE_URL = "https://example.com/api";
});

describe("notion-bridge handler", () => {
  it("rejects non-POST requests", async () => {
    const req = httpMocks.createRequest({ method: "GET" });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(405);
  });

  it("errors on missing body fields", async () => {
    const req = httpMocks.createRequest({ method: "POST", body: { request: "hi" } });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(400);
  });

  it("blocked requester case", async () => {
    const req = httpMocks.createRequest({ method: "POST", body: { request: "hi", summary: "sum", requester: "Ruslantara" } });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(403);
  });

  it("missing OPENAI_API_KEY case", async () => {
    delete process.env.OPENAI_API_KEY;
    const req = httpMocks.createRequest({ method: "POST", body: { request: "hi", summary: "sum", requester: "Alice" } });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(500);
  });

  it("successful call", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ result: "ok" })
    });
    const req = httpMocks.createRequest({ method: "POST", body: { request: "hi", summary: "sum", requester: "Bob" } });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
    expect(global.fetch).toHaveBeenCalled();
  });
});
