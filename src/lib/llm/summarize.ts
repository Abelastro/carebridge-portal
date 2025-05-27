import { createHash } from "node:crypto";
import type { SessionUser } from "@/lib/auth/session";
import { recordAuditEvent } from "@/lib/audit";
import { log } from "@/lib/logger";
import { complete } from "./bedrock";
import { inspectInput, validateSummary } from "./guardrails";
import { buildSummarizationPrompt, SUMMARY_SYSTEM_PROMPT } from "./prompt";

export class GuardrailError extends Error {
  constructor(
    public readonly reason: "prompt_injection" | "summary_validation",
    public readonly details: string[],
  ) {
    super(`Summary request blocked: ${reason}`);
    this.name = "GuardrailError";
  }
}

export type SummarizeInput = {
  note: string;
  encounterId: string;
  actor: SessionUser;
  ipAddress: string | null;
  userAgent: string | null;
};

export type SummarizeResult = {
  summary: string;
  modelId: string;
  durationMs: number;
};

export async function summarizeEncounterNote(input: SummarizeInput): Promise<SummarizeResult> {
  const noteHash = createHash("sha256").update(input.note).digest("hex");
  const inspection = inspectInput(input.note);

  if (inspection.blocked) {
    await recordAuditEvent({
      actorId: input.actor.id,
      action: "llm.summarize",
      resourceType: "Encounter",
      resourceId: input.encounterId,
      outcome: "DENIED",
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      metadata: {
        reason: "prompt_injection",
        findings: inspection.findings.map((finding) => finding.code),
        noteHash,
      },
    });

    log().warn(
      { encounterId: input.encounterId, actorId: input.actor.id, findings: inspection.findings },
      "blocked summarization request",
    );

    throw new GuardrailError(
      "prompt_injection",
      inspection.findings.map((finding) => finding.code),
    );
  }

  try {
    const completion = await complete({
      system: SUMMARY_SYSTEM_PROMPT,
      user: buildSummarizationPrompt(input.note),
    });

    const validation = validateSummary(completion.text, input.note);

    if (validation.issues.length > 0) {
      await recordAuditEvent({
        actorId: input.actor.id,
        action: "llm.summarize",
        resourceType: "Encounter",
        resourceId: input.encounterId,
        outcome: "ERROR",
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        metadata: {
          reason: "summary_validation",
          issues: validation.issues,
          modelId: completion.modelId,
          noteHash,
        },
      });

      throw new GuardrailError("summary_validation", validation.issues);
    }

    await recordAuditEvent({
      actorId: input.actor.id,
      action: "llm.summarize",
      resourceType: "Encounter",
      resourceId: input.encounterId,
      outcome: "SUCCESS",
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      metadata: {
        modelId: completion.modelId,
        durationMs: completion.durationMs,
        inputChars: completion.inputChars,
        outputChars: completion.outputChars,
        noteHash,
      },
    });

    return {
      summary: completion.text,
      modelId: completion.modelId,
      durationMs: completion.durationMs,
    };
  } catch (error) {
    if (error instanceof GuardrailError) {
      throw error;
    }

    await recordAuditEvent({
      actorId: input.actor.id,
      action: "llm.summarize",
      resourceType: "Encounter",
      resourceId: input.encounterId,
      outcome: "ERROR",
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      metadata: {
        reason: "provider_error",
        noteHash,
      },
    });

    log().error({ err: error, encounterId: input.encounterId }, "summarization provider failed");
    throw error;
  }
}
