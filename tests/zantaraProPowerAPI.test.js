import { describe, it, expect, beforeEach, vi } from "vitest";
import httpMocks from "node-mocks-http";
import handler from "../api/zantaraProPower.js";

describe("zantaraProPower API", () => {
  beforeEach(() => {
    process.env.OPENAI_API_KEY = "test";
    process.env.PRO_POWER_API_URL = "https://propower.example.com";
  });

  it("attaches Pro Power API success result", async () => {
    const openAIResponse = { result: "ok" };
    const proPowerResponse = { message: "done" };

    global.fetch = vi.fn()
      .mockResolvedValueOnce({ json: () => Promise.resolve(openAIResponse) })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(proPowerResponse)
      });

    const req = httpMocks.createRequest({ method: "POST", body: { prompt: "hi" } });
    const res = httpMocks.createResponse();
    await handler(req, res);

    const payload = JSON.parse(res._getData());
    expect(res.statusCode).toBe(200);
    expect(payload.data.proPower.success).toBe(true);
    expect(payload.data.proPower.data).toEqual(proPowerResponse);
  });

  it("attaches Pro Power API error result", async () => {
    const openAIResponse = { result: "ok" };
    const proPowerError = { error: "fail" };

    global.fetch = vi.fn()
      .mockResolvedValueOnce({ json: () => Promise.resolve(openAIResponse) })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve(proPowerError)
      });

    const req = httpMocks.createRequest({ method: "POST", body: { prompt: "hi" } });
    const res = httpMocks.createResponse();
    await handler(req, res);

    const payload = JSON.parse(res._getData());
    expect(res.statusCode).toBe(200);
    expect(payload.data.proPower.success).toBe(false);
    expect(payload.data.proPower.error).toBe("fail");
  });
});
