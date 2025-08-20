# ADR 0003: Put LLM guardrails behind one application boundary

- Status: accepted
- Date: 2026-05-14

## Context

Clinicians asked for help turning long encounter notes into short handoff summaries. A
direct provider call from the summary form would be the shortest implementation, but it
would spread policy across the UI and make behavior hard to audit. Encounter notes can
contain identifiers, and a generated summary can invent details that were not in the note.

The organization also needs a provider that works in development without AWS credentials.

## Decision

Introduce a single summary workflow in `src/lib/llm/summarize.ts`. All model calls go through
it. The workflow:

1. Inspects input for prompt-injection signals and blocks high-severity findings.
2. Redacts email addresses, phone numbers, record numbers, and government identifiers
   before calling the provider.
3. Calls a provider interface with a fixed system prompt and bounded output.
4. Validates the response for length, grounding, disclaimers, and leaked identifiers.
5. Persists the summary and writes an audit event with the model, duration, and source-note
   digest.

The Bedrock implementation uses the Converse API. A mock implementation extracts sentences
from the note for local development and tests. Neither provider sees an unredacted note.

## Consequences

- Policy changes happen in one place and are covered by unit tests.
- Requests are auditable without storing note contents in the audit log.
- The mock provider makes CI deterministic and offline.
- Extractive mock summaries are less fluent than model summaries, which is acceptable for
  development but should not be used to judge product quality.
- The redaction rules are pattern-based and will miss unusual formats. Treat the feature as
  a drafting aid, not a de-identification system.
- A model or guardrail outage degrades the summary feature but does not block clinical
  documentation.
