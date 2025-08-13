import { describe, it, expect, vi, beforeEach } from "vitest";
import { triggerMakeWebhook } from "../lib/makeTrigger.js";

beforeEach(() => {
  process.env.MAKE_API_TOKEN = "test-token";
});

describe("ZANTARA > triggerMakeWebhook", () => {
  it("should send default payload to Make webhook", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({}) });
    const result = await triggerMakeWebhook();
    expect(result).toBeDefined(); // may be empty object
  });

  it("should send custom data in payload", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({}) });
    const result = await triggerMakeWebhook({
      module: "UnitTest",
      status: "OK",
    });
    expect(result).toBeDefined();
  });

  it("should throw an error for invalid URL", async () => {
    // Override temporarily
    const originalURL = global.fetch;
    global.fetch = () => Promise.resolve({ ok: false, status: 400, text: () => "Bad Request" });

    await expect(triggerMakeWebhook()).rejects.toThrow("Make webhook error");

    global.fetch = originalURL;
  });

  it("should throw when MAKE_API_TOKEN is missing", async () => {
    delete process.env.MAKE_API_TOKEN;
    await expect(triggerMakeWebhook()).rejects.toThrow("Missing Make API token");
  });
});

