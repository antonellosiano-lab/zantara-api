import { describe, it, expect, beforeEach, vi } from "vitest";
import httpMocks from "node-mocks-http";
import { apiRequest } from "../helpers/apiRequest.js";

beforeEach(() => {
  process.env.OPENAI_API_KEY = "test";
});

describe("apiRequest", () => {
  it("returns 405 for non-POST", async () => {
    const req = httpMocks.createRequest({ method: "GET" });
    const res = httpMocks.createResponse();
    await apiRequest(req, res);
    expect(res.statusCode).toBe(405);
  });

  it("returns 500 when API key missing", async () => {
    delete process.env.OPENAI_API_KEY;
    const req = httpMocks.createRequest({ method: "POST", body: { url: "http://example.com" } });
    const res = httpMocks.createResponse();
    await apiRequest(req, res);
    expect(res.statusCode).toBe(500);
  });

  it("returns 400 when url missing", async () => {
    const req = httpMocks.createRequest({ method: "POST", body: {} });
    const res = httpMocks.createResponse();
    await apiRequest(req, res);
    expect(res.statusCode).toBe(400);
  });

  it("returns 403 for blocked requester", async () => {
    const req = httpMocks.createRequest({ method: "POST", body: { url: "http://example.com", requester: "Ruslantara" } });
    const res = httpMocks.createResponse();
    await apiRequest(req, res);
    expect(res.statusCode).toBe(403);
  });

  it("returns 200 on success", async () => {
    global.fetch = vi.fn().mockResolvedValue({ json: () => Promise.resolve({ ok: true }) });
    const req = httpMocks.createRequest({ method: "POST", body: { url: "http://example.com", payload: { a: 1 } } });
    const res = httpMocks.createResponse();
    await apiRequest(req, res);
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res._getData()).success).toBe(true);
  });
});
