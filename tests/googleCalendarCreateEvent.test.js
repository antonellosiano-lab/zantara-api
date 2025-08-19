import { describe, it, expect, beforeEach, vi } from "vitest";
import httpMocks from "node-mocks-http";
import { promises as fs } from "fs";
import handler from "../api/google/calendar.create_event.js";
import oauthHandler from "../api/google/oauth.js";

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

describe("google calendar create event handler", () => {
  it("returns 405 for non-POST", async () => {
    const req = httpMocks.createRequest({ method: "GET" });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(405);
  });

  it("returns 400 when fields missing", async () => {
    const req = httpMocks.createRequest({ method: "POST", body: { summary: "hi" } });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(400);
  });

  it("returns 403 for blocked requester", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: { summary: "a", start: "s", end: "e", requester: "Deanto" }
    });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(403);
  });

  it("returns 500 when tokens missing", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: { summary: "a", start: "s", end: "e", requester: "me" }
    });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(500);
  });

  it("creates event successfully (E2E)", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ access_token: "a", refresh_token: "r" })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: "123" })
      });

    const oauthReq = httpMocks.createRequest({
      method: "POST",
      body: { code: "c", redirect_uri: "uri" }
    });
    const oauthRes = httpMocks.createResponse();
    await oauthHandler(oauthReq, oauthRes);
    expect(oauthRes.statusCode).toBe(200);

    const req = httpMocks.createRequest({
      method: "POST",
      body: {
        summary: "meeting",
        start: "2024-01-01T10:00:00Z",
        end: "2024-01-01T11:00:00Z",
        requester: "user"
      }
    });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
    expect(data.data.id).toBe("123");
  });
});
