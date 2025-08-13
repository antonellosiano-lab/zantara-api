import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import httpMocks from "node-mocks-http";
import { promises as fs } from "fs";
import handler from "../api/google/oauth.js";

const TOKEN_PATH = "./lib/google_tokens.json";

beforeEach(async () => {
  process.env.OPENAI_API_KEY = "test";
  process.env.GOOGLE_CLIENT_ID = "cid";
  process.env.GOOGLE_CLIENT_SECRET = "secret";
  vi.resetAllMocks();
  try {
    await fs.unlink(TOKEN_PATH);
  } catch {}
});

afterEach(async () => {
  try {
    await fs.unlink(TOKEN_PATH);
  } catch {}
});

describe("google oauth handler", () => {
  it("returns 405 for non-POST", async () => {
    const req = httpMocks.createRequest({ method: "GET" });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(405);
  });

  it("returns 400 when code missing", async () => {
    const req = httpMocks.createRequest({ method: "POST", body: { redirect_uri: "http://localhost" } });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(400);
  });

  it("returns 403 for blocked requester", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: { code: "c", redirect_uri: "uri", requester: "Ruslantara" }
    });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(403);
  });

  it("exchanges code and saves tokens", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ access_token: "a", refresh_token: "r" })
    });
    const req = httpMocks.createRequest({
      method: "POST",
      body: { code: "c", redirect_uri: "uri", requester: "me" }
    });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    const content = await fs.readFile(TOKEN_PATH, "utf-8");
    expect(JSON.parse(content).access_token).toBe("a");
  });
});
