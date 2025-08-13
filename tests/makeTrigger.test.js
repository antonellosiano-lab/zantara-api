import { describe, it, expect, vi } from "vitest";
import { triggerMakeWebhook } from "../lib/makeTrigger.js";
import { timedCall } from "./utils/requestTimer.js";

describe("ZANTARA > triggerMakeWebhook", () => {
  it("should send default payload to Make webhook", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({}) });
    const result = await timedCall("triggerMakeWebhook", () => triggerMakeWebhook());
    expect(result).toBeDefined(); // may be empty object
  });

  it("should send custom data in payload", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({}) });
    const result = await timedCall("triggerMakeWebhook", () => triggerMakeWebhook({
      module: "UnitTest",
      status: "OK",
    }));
    expect(result).toBeDefined();
  });

  it("should throw an error for invalid URL", async () => {
    // Override temporarily
    const originalURL = global.fetch;
    global.fetch = () => Promise.resolve({ ok: false, status: 400, text: () => "Bad Request" });

    await expect(timedCall("triggerMakeWebhook", () => triggerMakeWebhook())).rejects.toThrow("Make webhook error");

    global.fetch = originalURL;
  });
});

