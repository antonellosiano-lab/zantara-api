import { describe, it, expect, beforeEach, vi } from "vitest";
import httpMocks from "node-mocks-http";
import handler from "../api/notion-write.js";

beforeEach(() => {
  process.env.OPENAI_API_KEY = "test";
  process.env.ZION_KEY = "zion";
  process.env.BASE_URL = "http://localhost";
  vi.resetAllMocks();
});

describe("notion-write handler", () => {
  it("returns 405 for non-POST", async () => {
    const req = httpMocks.createRequest({ method: "GET" });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(405);
  });

  it("returns 500 when API key missing", async () => {
    delete process.env.OPENAI_API_KEY;
    const req = httpMocks.createRequest({ method: "POST", body: { foo: "bar" } });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(500);
  });

  it("returns 400 when payload missing", async () => {
    const req = httpMocks.createRequest({ method: "POST" });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(400);
  });

  it("returns 403 for blocked requester", async () => {
    const req = httpMocks.createRequest({ method: "POST", body: { requester: "Ruslantara" } });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(403);
  });

  it("forwards payload to ZION", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ id: "123" })
    });
    const payload = { requester: "user", title: "Test" };
    const req = httpMocks.createRequest({ method: "POST", body: payload });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost/api/zion",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "x-zion-key": "zion" }),
        body: JSON.stringify(payload)
      })
    );
  });
});

