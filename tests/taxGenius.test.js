import { describe, it, expect, beforeEach, vi } from "vitest";
import httpMocks from "node-mocks-http";
import handler from "../api/taxGenius.js";
import { getAgentPrompt } from "../constants/prompts.js";

beforeEach(() => {
  process.env.OPENAI_API_KEY = "test";
  vi.restoreAllMocks();
});

describe("taxGenius API", () => {
  it("returns 405 for non-POST", async () => {
    const req = httpMocks.createRequest({ method: "GET" });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(405);
  });

  it("returns 500 when API key missing", async () => {
    delete process.env.OPENAI_API_KEY;
    const req = httpMocks.createRequest({ method: "POST", body: { prompt: "hi" } });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(500);
  });

  it("returns 400 when prompt missing", async () => {
    const req = httpMocks.createRequest({ method: "POST" });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(400);
  });

  it("returns 403 for blocked requester", async () => {
    const req = httpMocks.createRequest({ method: "POST", body: { prompt: "hi", requester: "Ruslantara" } });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(403);
  });

  it("calls OpenAI and returns 200 on success", async () => {
    const mockData = { result: "ok" };
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => mockData
    });
    const req = httpMocks.createRequest({ method: "POST", body: { prompt: "hi" } });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res._getData());
    expect(body.success).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith("https://api.openai.com/v1/chat/completions", expect.any(Object));
    const fetchOptions = global.fetch.mock.calls[0][1];
    const payload = JSON.parse(fetchOptions.body);
    expect(payload.messages[0].content).toBe(getAgentPrompt("Tax Genius"));
  });
});
