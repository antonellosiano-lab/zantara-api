import { describe, it, expect, beforeEach, vi } from "vitest";
import httpMocks from "node-mocks-http";
import handler from "../api/google/calendar/create-event.js";

vi.mock("../helpers/tokenStore.js", () => ({
  loadToken: vi.fn().mockResolvedValue({ access_token: "x" })
}));

vi.mock("googleapis", () => ({
  google: {
    auth: {
      OAuth2: vi.fn().mockImplementation(() => ({
        setCredentials: vi.fn()
      }))
    },
    calendar: vi.fn().mockReturnValue({
      events: {
        insert: vi.fn().mockResolvedValue({ data: { id: "1" } })
      }
    })
  }
}));

const { loadToken } = await import("../helpers/tokenStore.js");
const { google } = await import("googleapis");

describe("calendar create-event handler", () => {
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

  it("returns 400 for missing fields", async () => {
    const req = httpMocks.createRequest({ method: "POST", body: { summary: "a" } });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(400);
  });

  it("creates event on success", async () => {
    const body = { summary: "a", start: "2023-01-01T10:00:00Z", end: "2023-01-01T11:00:00Z" };
    const req = httpMocks.createRequest({ method: "POST", body });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(loadToken).toHaveBeenCalled();
    const insertMock = google.calendar.mock.results[0].value.events.insert;
    expect(insertMock).toHaveBeenCalled();
  });
});
