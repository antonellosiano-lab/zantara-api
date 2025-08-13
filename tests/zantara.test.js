import { describe, it, expect, beforeEach, vi } from "vitest";
import httpMocks from "node-mocks-http";
import fs from "fs";
import path from "path";
import handler from "../api/zantara.js";

// Dynamically discover agent endpoints based on API files using createAgentHandler
const agents = fs
  .readdirSync(path.join(process.cwd(), "api"))
  .filter((file) => file.endsWith(".js") && file !== "zantara.js")
  .filter((file) =>
    fs
      .readFileSync(path.join(process.cwd(), "api", file), "utf8")
      .includes("createAgentHandler")
  )
  .map((file) => file.replace(".js", ""))
  .sort();

beforeEach(() => {
  process.env.OPENAI_API_KEY = "test";
  process.env.BASE_URL = "http://localhost";
  vi.resetAllMocks();
});

describe("Zantara orchestrator", () => {
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

  it("returns 200 on success and aggregates results", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ success: true })
    });

    const req = httpMocks.createRequest({ method: "POST", body: { prompt: "hi", requester: "user" } });
    const res = httpMocks.createResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
    expect(Object.keys(data.data).sort()).toEqual(agents);
    for (const agent of agents) {
      expect(data.data).toHaveProperty(agent);
    }
    expect(global.fetch).toHaveBeenCalledTimes(agents.length);
  });
});

