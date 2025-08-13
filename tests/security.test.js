import { describe, it, expect } from "vitest";
import httpMocks from "node-mocks-http";
import { withSecurity } from "../helpers/security.js";

function createReqRes(headers = {}, body = {}) {
  const req = httpMocks.createRequest({ method: "POST", url: "/", headers, body });
  const res = httpMocks.createResponse();
  return { req, res };
}

describe("security middleware", () => {
  it("throttles requests exceeding token bucket", async () => {
    let count = 0;
    const handler = async (req, res) => {
      count += 1;
      res.status(200).json({ ok: true });
    };
    const secured = withSecurity(handler, { rateLimit: { tokens: 2, interval: 1000 } });

    const { req: req1, res: res1 } = createReqRes({}, { a: 1 });
    await secured(req1, res1);
    expect(res1.statusCode).toBe(200);

    const { req: req2, res: res2 } = createReqRes({}, { a: 1 });
    await secured(req2, res2);
    expect(res2.statusCode).toBe(200);

    const { req: req3, res: res3 } = createReqRes({}, { a: 1 });
    await secured(req3, res3);
    expect(res3.statusCode).toBe(429);
    expect(count).toBe(2);
  });

  it("returns stored response for duplicate idempotency key", async () => {
    let count = 0;
    const handler = async (req, res) => {
      count += 1;
      res.status(200).json({ value: count });
    };
    const secured = withSecurity(handler);

    const headers = { "idempotency-key": "abc" };
    const { req: req1, res: res1 } = createReqRes(headers, {});
    await secured(req1, res1);
    expect(res1.statusCode).toBe(200);
    const first = res1._getJSONData();
    expect(first.value).toBe(1);

    const { req: req2, res: res2 } = createReqRes(headers, {});
    await secured(req2, res2);
    expect(res2.statusCode).toBe(200);
    const second = res2._getJSONData();
    expect(second.value).toBe(1);
    expect(count).toBe(1);
  });
});

