import { describe, it, expect, beforeEach, vi } from "vitest";
import httpMocks from "node-mocks-http";
import crypto from "crypto";
import handler from "../api/github/webhook.js";

beforeEach(() => {
  process.env.OPENAI_API_KEY = "test";
  process.env.GITHUB_WEBHOOK_SECRET = "secret";
});

describe("github webhook", () => {
  it("returns 405 for non-POST", async () => {
    const req = httpMocks.createRequest({ method: "GET" });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(405);
  });

  it("returns 401 for invalid signature", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: { test: true },
      headers: { "x-hub-signature-256": "bad" }
    });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(401);
  });

  it("processes push event", async () => {
    const body = {
      repository: { full_name: "test/repo" },
      sender: { login: "octocat" }
    };
    const sig =
      "sha256=" +
      crypto
        .createHmac("sha256", process.env.GITHUB_WEBHOOK_SECRET)
        .update(JSON.stringify(body))
        .digest("hex");

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({})
    });

    const req = httpMocks.createRequest({
      method: "POST",
      headers: { "x-hub-signature-256": sig, "x-github-event": "push" },
      body
    });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
  });
});
