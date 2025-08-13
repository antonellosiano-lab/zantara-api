import { describe, it, expect, beforeEach, vi } from "vitest";
import httpMocks from "node-mocks-http";
import handler from "../api/taxGenius.js";
import { getAgentPrompt } from "../constants/prompts.js";

beforeEach(() => {
  process.env.OPENAI_API_KEY = "test";
  vi.resetAllMocks();
});

describe("Tax Genius API", () => {
  it("returns 400 when prompt missing", async () => {
    const req = httpMocks.createRequest({ method: "POST" });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(400);
  });

  it("calls OpenAI with agent-specific prompt", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ result: "ok" })
    });
    global.fetch = mockFetch;
    const req = httpMocks.createRequest({ method: "POST", body: { prompt: "hi" } });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.openai.com/v1/chat/completions",
      expect.objectContaining({ headers: expect.any(Object), body: expect.any(String) })
    );
    const { body } = mockFetch.mock.calls[0][1];
    const parsed = JSON.parse(body);
    expect(parsed.messages[0].content).toBe(getAgentPrompt("Tax Genius"));
    expect(parsed.messages[1].content).toBe("hi");
  });
});
