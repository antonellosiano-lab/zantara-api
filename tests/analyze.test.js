import { describe, it, expect, beforeEach } from "vitest";
import httpMocks from "node-mocks-http";
import handler from "../api/analyze.js";
import { analyzeSchema } from "../helpers/analyzeSchema.js";

describe("Analyze endpoint", () => {
  beforeEach(() => {
    process.env.OPENAI_API_KEY = "test";
  });

  it("accepts minimal valid body", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: { nationality: "IT", goal: "work" }
    });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
    expect(analyzeSchema(data.data)).toBe(true);
  });
});
