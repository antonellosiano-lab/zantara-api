import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import httpMocks from "node-mocks-http";
import handler from "../api/setupMaster.js";
import { getAgentPrompt } from "../constants/prompts.js";

beforeEach(() => {
  process.env.OPENAI_API_KEY = "test";
  global.fetch = vi.fn().mockResolvedValue({
    json: () => Promise.resolve({ result: "ok" })
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("setupMaster handler", () => {
  it("returns 200 and logs JSON on success", async () => {
    const req = httpMocks.createRequest({ method: "POST", body: { prompt: "hi" } });
    const res = httpMocks.createResponse();
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await handler(req, res);

    expect(res.statusCode).toBe(200);

    const fetchBody = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(fetchBody.messages[0].content).toBe(getAgentPrompt("Setup Master"));

    expect(logSpy).toHaveBeenCalled();
    const parsedLog = JSON.parse(logSpy.mock.calls[0][0]);
    expect(parsedLog.action).toBe("success");
  });
});
