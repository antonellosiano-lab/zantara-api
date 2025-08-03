import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { triggerMakeWebhook } from "../lib/makeTrigger.js";

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ result: "ok" }),
    text: () => Promise.resolve("OK")
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("triggerMakeWebhook", () => {
  it("sends default payload", async () => {
    await triggerMakeWebhook();
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toBe("https://hook.eu2.make.com/g5xgemwq5pi9carypqg3go66afg4ucay");
    const body = JSON.parse(options.body);
    expect(body.source).toBe("Zantara");
  });

  it("sends custom data", async () => {
    await triggerMakeWebhook({ module: "UnitTest", status: "OK" });
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.module).toBe("UnitTest");
    expect(body.status).toBe("OK");
  });

  it("throws error for non-OK response", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: () => Promise.resolve("Bad Request"),
      json: () => Promise.resolve({})
    });

    await expect(triggerMakeWebhook()).rejects.toThrow(/Make webhook error/);
  });
});

