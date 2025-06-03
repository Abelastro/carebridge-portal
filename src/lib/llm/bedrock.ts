import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import { env } from "@/lib/env";
import { redactPII } from "./guardrails";

export type CompletionRequest = {
  system: string;
  user: string;
};

export type CompletionResult = {
  text: string;
  modelId: string;
  durationMs: number;
  inputChars: number;
  outputChars: number;
};

let client: BedrockRuntimeClient | undefined;

function mockCompletion(prompt: string): string {
  const tagged = prompt.match(/<note>\n?([\s\S]*?)\n?<\/note>/);
  const note = (tagged?.[1] ?? prompt).replace(/\s+/g, " ").trim();
  const sentences = note
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  const body = sentences.slice(0, 3).join(" ");
  const summary = `Summary: ${body}`;

  if (summary.length <= note.length) {
    return redactPII(summary).text;
  }

  return redactPII(`Summary: ${sentences[0] ?? note}`).text;
}

export async function complete(request: CompletionRequest): Promise<CompletionResult> {
  const config = env();
  const startedAt = Date.now();

  if (config.LLM_PROVIDER === "mock") {
    const text = mockCompletion(request.user);

    return {
      text,
      modelId: "local-extractive-v1",
      durationMs: Date.now() - startedAt,
      inputChars: request.user.length,
      outputChars: text.length,
    };
  }

  client ??= new BedrockRuntimeClient({ region: config.AWS_REGION });

  const response = await client.send(
    new ConverseCommand({
      modelId: config.BEDROCK_MODEL_ID,
      system: [{ text: request.system }],
      messages: [{ role: "user", content: [{ text: request.user }] }],
      inferenceConfig: {
        maxTokens: 512,
        temperature: 0.2,
        topP: 0.9,
      },
    }),
  );

  const text = (response.output?.message?.content ?? [])
    .map((part) => part.text ?? "")
    .join("")
    .trim();

  if (!text) {
    throw new Error("Bedrock returned an empty completion");
  }

  return {
    text,
    modelId: config.BEDROCK_MODEL_ID,
    durationMs: Date.now() - startedAt,
    inputChars: request.user.length,
    outputChars: text.length,
  };
}
