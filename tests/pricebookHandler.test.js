import { describe, it, expect, beforeEach } from "vitest";
import httpMocks from "node-mocks-http";
import handler from "../api/index/pricebook/[code].js";
import { pricebookSchema } from "../helpers/pricebookSchema.js";

beforeEach(() => {
  process.env.OPENAI_API_KEY = "test";
});

describe("GET /index/pricebook/:code", () => {
  it("returns pricebook matching schema", async () => {
    const req = httpMocks.createRequest({
      method: "GET",
      query: { code: "E23A" }
    });
    const res = httpMocks.createResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res._getData());
    expect(() => pricebookSchema.parse(data)).not.toThrow();
    expect(data.data.code).toBe("E23A");
  });
});
