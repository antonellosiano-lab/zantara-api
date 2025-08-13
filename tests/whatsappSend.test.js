import { describe, it, expect, beforeEach, vi } from "vitest";
import httpMocks from "node-mocks-http";
import handler from "../api/whatsapp/send.js";

beforeEach(() => {
  process.env.OPENAI_API_KEY = "test";
  process.env.META_WHATSAPP_TOKEN = "token";
  process.env.META_WHATSAPP_PHONE_NUMBER_ID = "12345";
  vi.resetAllMocks();
});

describe("whatsapp send", () => {
  it("returns 405 for non-POST", async () => {
    const req = httpMocks.createRequest({ method: "GET" });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(405);
  });

  it("returns 500 when API key missing", async () => {
    delete process.env.OPENAI_API_KEY;
    const req = httpMocks.createRequest({ method: "POST", body: { to: "1", message: "hi" } });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(500);
  });

  it("returns 400 when body missing", async () => {
    const req = httpMocks.createRequest({ method: "POST" });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(400);
  });

  it("returns 403 for blocked requester", async () => {
    const req = httpMocks.createRequest({ method: "POST", body: { to: "1", message: "hi", requester: "Ruslantara" } });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(403);
  });

  it("returns 500 when Meta API fails", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: { message: "fail" } })
    });
    const req = httpMocks.createRequest({ method: "POST", body: { to: "1", message: "hi", requester: "user" } });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(500);
  });

  it("returns 200 on success", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: "123" })
    });
    const req = httpMocks.createRequest({ method: "POST", body: { to: "1", message: "hi", requester: "user" } });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
    expect(global.fetch).toHaveBeenCalled();
  });
});

