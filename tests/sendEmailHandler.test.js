import { describe, it, expect, beforeEach, vi } from "vitest";
import httpMocks from "node-mocks-http";
import { sendEmailHandler } from "../handlers/sendEmailHandler.js";

vi.mock("../helpers/sendEmail.js", () => ({
  sendEmail: vi.fn().mockResolvedValue()
}));

beforeEach(() => {
  process.env.OPENAI_API_KEY = "test";
  process.env.GMAIL_USER = "user";
  process.env.GMAIL_PASS = "pass";
});

describe("sendEmailHandler", () => {
  it("returns 405 for non-POST", async () => {
    const req = httpMocks.createRequest({ method: "GET" });
    const res = httpMocks.createResponse();
    await sendEmailHandler(req, res);
    expect(res.statusCode).toBe(405);
  });

  it("returns 500 when API key missing", async () => {
    delete process.env.OPENAI_API_KEY;
    const req = httpMocks.createRequest({ method: "POST", body: { to: "a", subject: "b", text: "c" } });
    const res = httpMocks.createResponse();
    await sendEmailHandler(req, res);
    expect(res.statusCode).toBe(500);
  });

  it("returns 400 when fields missing", async () => {
    const req = httpMocks.createRequest({ method: "POST", body: { to: "a" } });
    const res = httpMocks.createResponse();
    await sendEmailHandler(req, res);
    expect(res.statusCode).toBe(400);
  });

  it("returns 403 for blocked requester", async () => {
    const req = httpMocks.createRequest({ method: "POST", body: { to: "a", subject: "b", text: "c", requester: "Ruslantara" } });
    const res = httpMocks.createResponse();
    await sendEmailHandler(req, res);
    expect(res.statusCode).toBe(403);
  });

  it("returns 200 on success", async () => {
    const req = httpMocks.createRequest({ method: "POST", body: { to: "a", subject: "b", text: "c" } });
    const res = httpMocks.createResponse();
    await sendEmailHandler(req, res);
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res._getData()).success).toBe(true);
  });
});
