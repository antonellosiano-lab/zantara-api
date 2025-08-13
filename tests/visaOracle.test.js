import { describe, it, expect, beforeEach, vi } from "vitest";
import httpMocks from "node-mocks-http";
import { createAgentHandler } from "../handlers/createAgentHandler.js";
import { getAgentPrompt } from "../constants/prompts.js";

const handler = createAgentHandler("Visa Oracle");

describe("visaOracle handler", () => {
  beforeEach(() => {
    process.env.OPENAI_API_KEY = "test";
  });

  it("calls OpenAI with specialized prompt and returns structured response", async () => {
    const expectedPrompt = getAgentPrompt("Visa Oracle");
    const mockOpenAIResponse = {
      choices: [
        {
          message: { role: "assistant", content: "dummy" }
        }
      ]
    };

    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => mockOpenAIResponse
    });
    global.fetch = fetchMock;

    const req = httpMocks.createRequest({
      method: "POST",
      body: { prompt: "Test" }
    });
    const res = httpMocks.createResponse();

    await handler(req, res);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, options] = fetchMock.mock.calls[0];
    const body = JSON.parse(options.body);

    expect(body.messages[0]).toEqual({ role: "system", content: expectedPrompt });
    expect(body.messages[1]).toEqual({ role: "user", content: "Test" });

    const jsonResponse = JSON.parse(res._getData());
    expect(res.statusCode).toBe(200);
    expect(jsonResponse.success).toBe(true);
    expect(jsonResponse.data).toEqual(mockOpenAIResponse);
  });
});

