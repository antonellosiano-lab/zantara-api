import { describe, it, expect, beforeEach, vi } from "vitest";
import httpMocks from "node-mocks-http";
import { meetingSyncHandler } from "../handlers/meetingSyncHandler.js";

beforeEach(() => {
  process.env.OPENAI_API_KEY = "test";
  process.env.MAKE_API_TOKEN = "make-test";
  process.env.MEETING_SYNC_WEBHOOK_URL = "https://example.com";
});

describe("meetingSyncHandler", () => {
  it("returns 405 for non-POST", async () => {
    const req = httpMocks.createRequest({ method: "GET" });
    const res = httpMocks.createResponse();
    await meetingSyncHandler(req, res);
    expect(res.statusCode).toBe(405);
  });

  it("returns 400 when fields missing", async () => {
    const req = httpMocks.createRequest({ method: "POST" });
    const res = httpMocks.createResponse();
    await meetingSyncHandler(req, res);
    expect(res.statusCode).toBe(400);
  });

  it("returns 403 for blocked requester", async () => {
    const req = httpMocks.createRequest({ method: "POST", body: { title: "t", datetimeStart: "a", datetimeEnd: "b", description: "d", requester: "Ruslantara" } });
    const res = httpMocks.createResponse();
    await meetingSyncHandler(req, res);
    expect(res.statusCode).toBe(403);
  });

  it("returns 200 on success", async () => {
    global.fetch = vi.fn().mockResolvedValue({ json: () => Promise.resolve({ result: "ok" }) });
    const req = httpMocks.createRequest({ method: "POST", body: { title: "Call", datetimeStart: "2025-08-05T14:00:00+08:00", datetimeEnd: "2025-08-05T14:30:00+08:00", description: "Discuss" } });
    const res = httpMocks.createResponse();
    await meetingSyncHandler(req, res);
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res._getData()).success).toBe(true);
  });
});
