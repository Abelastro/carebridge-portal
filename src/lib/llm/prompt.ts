const MAX_NOTE_LENGTH = 12000;

export const SUMMARY_SYSTEM_PROMPT = [
  "You summarize clinical encounter notes for a care coordination team.",
  "Use only facts that appear in the note.",
  "Do not add diagnoses, treatment advice, or speculation.",
  "Omit names, dates of birth, addresses, phone numbers, email addresses, and record numbers.",
  "Write two to four sentences of plain text.",
  "Begin the summary with the word Summary:",
].join(" ");

export function buildSummarizationPrompt(note: string): string {
  const normalized = note.trim().slice(0, MAX_NOTE_LENGTH);

  return [
    "Summarize the clinical note inside the <note> tags.",
    "Return plain text only. Do not use markdown.",
    "<note>",
    normalized,
    "</note>",
  ].join("\n");
}
