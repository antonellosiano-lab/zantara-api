import { describe, it, expect, beforeEach } from "vitest";
import httpMocks from "node-mocks-http";
import handler from "../api/index/permit.js";
import { permitSchema } from "../helpers/permitSchema.js";

beforeEach(() => {
  process.env.OPENAI_API_KEY = "test";
});

describe("GET /index/permit", () => {
  it("returns data matching permitSchema", async () => {
    const req = httpMocks.createRequest({ method: "GET" });
    const res = httpMocks.createResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res._getData());
    expect(() => permitSchema.parse(data)).not.toThrow();
  });
});
