import { NextResponse, type NextRequest } from "next/server";
import { recordAuditEvent } from "@/lib/audit";
import { can } from "@/lib/auth/rbac";
import { getSession, requestMeta } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { GuardrailError, summarizeEncounterNote } from "@/lib/llm/summarize";
import { log } from "@/lib/logger";
import { summarizeSchema } from "@/lib/validation";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (!can(session.user.role, "note:summarize")) {
    return NextResponse.json({ error: "You do not have permission to summarize notes." }, { status: 403 });
  }

  const origin = request.headers.get("origin");
  const expectedOrigin = new URL(request.url).origin;

  if (origin && origin !== expectedOrigin) {
    return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  }

  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return NextResponse.json({ error: "Cross-site request rejected." }, { status: 403 });
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = summarizeSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
  }

  const { id } = await params;
  const encounter = await db().encounter.findUnique({
    where: { id },
    select: { id: true, note: true, clinicianId: true },
  });

  if (!encounter) {
    return NextResponse.json({ error: "Encounter not found." }, { status: 404 });
  }

  if (session.user.role === "CLINICIAN" && encounter.clinicianId !== session.user.id) {
    return NextResponse.json(
      { error: "Only the documenting clinician can summarize this note." },
      { status: 403 },
    );
  }

  const meta = await requestMeta();

  try {
    const result = await summarizeEncounterNote({
      note: encounter.note,
      encounterId: encounter.id,
      actor: session.user,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    await db().encounter.update({
      where: { id: encounter.id },
      data: {
        summary: result.summary,
        summaryModel: result.modelId,
        summarizedAt: new Date(),
      },
    });

    await recordAuditEvent({
      actorId: session.user.id,
      action: "encounter.summary.save",
      resourceType: "Encounter",
      resourceId: encounter.id,
      outcome: "SUCCESS",
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      metadata: { modelId: result.modelId, durationMs: result.durationMs },
    });

    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof GuardrailError) {
      return NextResponse.json(
        {
          error:
            error.reason === "prompt_injection"
              ? "This note was blocked by the input guardrail. Review the note before retrying."
              : "The generated summary did not pass validation. Try again or edit the note.",
          reason: error.reason,
          details: error.details,
        },
        { status: 422 },
      );
    }

    log().error({ err: error, encounterId: encounter.id }, "summarization route failed");
    return NextResponse.json(
      { error: "The summarization service is temporarily unavailable." },
      { status: 502 },
    );
  }
}
