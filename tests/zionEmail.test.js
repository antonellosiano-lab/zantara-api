import { describe, it, expect, beforeEach, vi } from "vitest";
import httpMocks from "node-mocks-http";
import handler from "../api/zion/email.js";
import { sendEmail } from "../helpers/sendEmail.js";

vi.mock("../helpers/sendEmail.js", () => ({
  sendEmail: vi.fn()
}));

beforeEach(() => {
  process.env.OPENAI_API_KEY = "test";
  process.env.GMAIL_USER = "user";
  process.env.GMAIL_PASS = "pass";
  sendEmail.mockResolvedValue();
});

describe("/api/zion/email", () => {
  it("returns 405 for non-POST", async () => {
    const req = httpMocks.createRequest({ method: "GET" });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(405);
  });

  it("returns 500 when API key missing", async () => {
    delete process.env.OPENAI_API_KEY;
    const req = httpMocks.createRequest({ method: "POST", body: { ACTION: "Test", TO: "a@b.com", TEXT: "Hello" } });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(500);
  });

  it("returns 400 when payload missing", async () => {
    const req = httpMocks.createRequest({ method: "POST", body: {} });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(400);
  });

  it("returns 403 for blocked requester", async () => {
    const req = httpMocks.createRequest({ method: "POST", body: { ACTION: "Test", TO: "a@b.com", TEXT: "Hello", requester: "Ruslantara" } });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(403);
  });

  it("returns 200 on success", async () => {
    const req = httpMocks.createRequest({ method: "POST", body: { ACTION: "Test", TO: "a@b.com", TEXT: "Hello" } });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res._getData()).success).toBe(true);
  });
});
