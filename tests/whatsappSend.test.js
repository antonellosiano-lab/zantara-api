import { describe, it, expect, beforeEach, vi } from "vitest";
import httpMocks from "node-mocks-http";
import handler from "../api/whatsapp/send.js";

beforeEach(() => {
  process.env.OPENAI_API_KEY = "test";
  process.env.WHATSAPP_TOKEN = "token";
  process.env.WHATSAPP_PHONE_ID = "123";
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

  it("returns 400 when to or message missing", async () => {
    const req = httpMocks.createRequest({ method: "POST", body: { to: "1" } });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(400);
  });

  it("blocks specified requester", async () => {
    const req = httpMocks.createRequest({ method: "POST", body: { to: "1", message: "hi", requester: "Ruslantara" } });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(403);
  });

  it("returns 500 when WhatsApp token missing", async () => {
    delete process.env.WHATSAPP_TOKEN;
    const req = httpMocks.createRequest({ method: "POST", body: { to: "1", message: "hi" } });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(500);
  });

  it("returns 200 on success", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ message: "sent" })
    });
    const req = httpMocks.createRequest({ method: "POST", body: { to: "1", message: "hi", requester: "user" } });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
    expect(global.fetch).toHaveBeenCalled();
    expect(global.fetch.mock.calls[0][0]).toContain("123");
  });
});

