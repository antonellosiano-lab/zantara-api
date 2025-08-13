import { describe, it, expect, beforeEach, vi } from "vitest";
import httpMocks from "node-mocks-http";

vi.mock("../helpers/notionLogger.js", () => ({
  writeAgentResult: vi.fn().mockResolvedValue()
}));

import handler from "../api/morgana.js";
import { writeAgentResult } from "../helpers/notionLogger.js";

beforeEach(() => {
  process.env.OPENAI_API_KEY = "test";
  vi.clearAllMocks();
  writeAgentResult.mockResolvedValue();
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ result: "ok" })
  });
});

describe("morgana handler notion log", () => {
  it("calls writeAgentResult with correct payload", async () => {
    const req = httpMocks.createRequest({ method: "POST", body: { prompt: "hi" } });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(writeAgentResult).toHaveBeenCalledWith("morgana", "hi", { result: "ok" });
    expect(res.statusCode).toBe(200);
  });

  it("continues when writeAgentResult fails", async () => {
    writeAgentResult.mockRejectedValueOnce(new Error("fail"));
    const req = httpMocks.createRequest({ method: "POST", body: { prompt: "hello" } });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
  });
});
