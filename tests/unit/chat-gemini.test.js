import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@google/genai", () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({})),
  FunctionCallingConfigMode: { AUTO: "AUTO" },
  createPartFromFunctionResponse: vi.fn((id, name, result) => ({ id, name, result })),
  HarmCategory: {
    HARM_CATEGORY_HATE_SPEECH: "HARM_CATEGORY_HATE_SPEECH",
    HARM_CATEGORY_DANGEROUS_CONTENT: "HARM_CATEGORY_DANGEROUS_CONTENT",
    HARM_CATEGORY_SEXUALLY_EXPLICIT: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
    HARM_CATEGORY_HARASSMENT: "HARM_CATEGORY_HARASSMENT",
  },
  HarmBlockThreshold: {
    BLOCK_MEDIUM_AND_ABOVE: "BLOCK_MEDIUM_AND_ABOVE",
  },
}));

vi.mock("../../src/services/chat-tool-handlers.js", () => ({
  civitraToolDeclarations: [],
  executeToolCall: vi.fn().mockResolvedValue({ result: "mock" }),
}));

vi.mock("../../src/config/system-prompt.js", () => ({ default: "test system prompt" }));
vi.mock("../../src/config/knowledge-base.js", () => ({ default: "test kb" }));

import { createGenaiClient, runChatWithToolsAndStream } from "../../src/services/chat-gemini.js";
import { executeToolCall } from "../../src/services/chat-tool-handlers.js";

function mockRes() {
  const chunks = [];
  return {
    write: vi.fn((data) => chunks.push(data)),
    end: vi.fn(),
    _chunks: chunks,
  };
}

describe("createGenaiClient", () => {
  it("returns an object", () => {
    const client = createGenaiClient("test-key");
    expect(client).toBeDefined();
    expect(typeof client).toBe("object");
  });
});

describe("runChatWithToolsAndStream", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("streams text when there are no tool calls", async () => {
    const ai = {
      models: {
        generateContent: vi.fn().mockResolvedValue({
          functionCalls: null,
          text: "Hello world",
          usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5, totalTokenCount: 15 },
        }),
      },
    };

    const res = mockRes();
    const contents = [{ role: "user", parts: [{ text: "Hi" }] }];

    const result = await runChatWithToolsAndStream(ai, contents, res);

    expect(result).toBe("Hello world");
    expect(res.write).toHaveBeenCalled();
    const written = res._chunks.join("");
    expect(written).toContain("Hello world");
  });

  it("handles one tool call round then returns final text", async () => {
    const ai = {
      models: {
        generateContent: vi
          .fn()
          .mockResolvedValueOnce({
            functionCalls: [{ name: "lookup_election_faq", args: { query: "test" }, id: "1" }],
            candidates: [{ content: { role: "model", parts: [] } }],
            usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5, totalTokenCount: 15 },
          })
          .mockResolvedValueOnce({
            functionCalls: null,
            text: "Final answer",
            usageMetadata: { promptTokenCount: 20, candidatesTokenCount: 8, totalTokenCount: 28 },
          }),
      },
    };

    const res = mockRes();
    const contents = [{ role: "user", parts: [{ text: "election faq" }] }];

    const result = await runChatWithToolsAndStream(ai, contents, res);

    expect(executeToolCall).toHaveBeenCalledWith("lookup_election_faq", { query: "test" });
    expect(result).toBe("Final answer");
    const written = res._chunks.join("");
    expect(written).toContain("Final answer");
  });
});
