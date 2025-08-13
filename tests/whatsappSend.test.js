import { describe, it, expect, beforeEach, vi } from "vitest";
import httpMocks from "node-mocks-http";
import handler from "../api/whatsapp/send.js";

beforeEach(() => {
  process.env.OPENAI_API_KEY = "test";
  process.env.WHATSAPP_PHONE_ID = "123";
  process.env.WHATSAPP_TOKEN = "token";
  vi.resetAllMocks();
});

describe("whatsapp send handler", () => {
  it("returns 405 for non-POST", async () => {
    const req = httpMocks.createRequest({ method: "GET" });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(405);
  });

  it("returns 500 when API key missing", async () => {
    delete process.env.OPENAI_API_KEY;
    const req = httpMocks.createRequest({ method: "POST" });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(500);
  });

  it("returns 403 for blocked requester", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: { requester: "Ruslantara", to: "1", type: "template", template: { name: "test", language: { code: "en" } } },
    });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(403);
  });

  it("returns 400 when session expired for text", async () => {
    const past = Date.now() - 73 * 60 * 60 * 1000;
    const req = httpMocks.createRequest({
      method: "POST",
      body: { to: "1", type: "text", message: "hi", lastInteraction: past },
    });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(400);
  });

  it("returns 200 on successful text message", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: "msg" })
    });
    const req = httpMocks.createRequest({
      method: "POST",
      body: {
        to: "1",
        type: "text",
        message: "hello",
        lastInteraction: Date.now(),
      },
    });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
    expect(global.fetch).toHaveBeenCalled();
  });
});

