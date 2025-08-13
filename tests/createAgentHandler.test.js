import { describe, it, expect, beforeEach, vi } from "vitest";
import httpMocks from "node-mocks-http";

vi.mock("../helpers/notionClient.js", () => ({
  saveAgentOutput: vi.fn().mockResolvedValue()
}));

import { saveAgentOutput } from "../helpers/notionClient.js";
import { createAgentHandler } from "../handlers/createAgentHandler.js";

const handler = createAgentHandler("Test Agent");

beforeEach(() => {
  process.env.OPENAI_API_KEY = "test";
  process.env.NOTION_DATABASE_ID = "db";
  vi.clearAllMocks();
});

describe("createAgentHandler", () => {
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

  it("returns 200 on success and logs to notion", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({
        choices: [{ message: { content: "hello" } }]
      })
    });
    const req = httpMocks.createRequest({ method: "POST", body: { prompt: "hi" } });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res._getData()).success).toBe(true);
    expect(saveAgentOutput).toHaveBeenCalledWith("db", "Test Agent", "hi", "hello");
  });
});
