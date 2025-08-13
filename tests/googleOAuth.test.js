import { describe, it, expect, beforeEach, vi } from "vitest";
import httpMocks from "node-mocks-http";
import handler from "../api/google/oauth.js";

vi.mock("../helpers/tokenStore.js", () => ({
  saveToken: vi.fn().mockResolvedValue()
}));

vi.mock("googleapis", () => ({
  google: {
    auth: {
      OAuth2: vi.fn().mockImplementation(() => ({
        getToken: vi.fn().mockResolvedValue({ tokens: { access_token: "x" } })
      }))
    }
  }
}));

const { saveToken } = await import("../helpers/tokenStore.js");
const { google } = await import("googleapis");

describe("google OAuth handler", () => {
  beforeEach(() => {
    process.env.OPENAI_API_KEY = "test";
    process.env.GOOGLE_CLIENT_ID = "id";
    process.env.GOOGLE_CLIENT_SECRET = "secret";
    process.env.GOOGLE_REDIRECT_URI = "uri";
  });

  it("returns 405 for non-POST", async () => {
    const req = httpMocks.createRequest({ method: "GET" });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(405);
  });

  it("returns 400 when code missing", async () => {
    const req = httpMocks.createRequest({ method: "POST", body: {} });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(400);
  });

  it("stores tokens on success", async () => {
    const req = httpMocks.createRequest({ method: "POST", body: { code: "abc" } });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(saveToken).toHaveBeenCalled();
    expect(google.auth.OAuth2).toHaveBeenCalled();
  });
});
