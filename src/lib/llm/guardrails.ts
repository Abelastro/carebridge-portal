export type Severity = "low" | "medium" | "high";

export type Finding = {
  code: string;
  severity: Severity;
  detail: string;
};

type InjectionSignal = {
  code: string;
  pattern: RegExp;
  severity: Severity;
};

const INJECTION_SIGNALS: InjectionSignal[] = [
  {
    code: "instruction_override",
    pattern: /ignore\s+(?:all\s+|any\s+)?(?:previous|prior|above|earlier)\s+(?:instructions|prompts?|rules?)/i,
    severity: "high",
  },
  {
    code: "system_prompt_override",
    pattern: /disregard\s+(?:the\s+)?(?:system|developer|safety)\s+(?:prompt|message|instructions)/i,
    severity: "high",
  },
  {
    code: "prompt_exfiltration",
    pattern: /(?:reveal|print|repeat|show)\s+(?:your|the)\s+(?:system|developer)\s+(?:prompt|instructions)/i,
    severity: "high",
  },
  {
    code: "jailbreak",
    pattern: /\b(?:jailbreak|DAN mode|do anything now)\b/i,
    severity: "high",
  },
  {
    code: "safety_bypass",
    pattern: /\b(?:override|bypass|disable)\s+(?:the\s+)?(?:safety|guardrails?|policy|policies)/i,
    severity: "high",
  },
  {
    code: "role_reassignment",
    pattern: /you\s+are\s+now\s+(?:a|an|in)\s+/i,
    severity: "medium",
  },
  {
    code: "unrestricted_persona",
    pattern: /act\s+as\s+(?:a|an)\s+(?:unrestricted|uncensored|unfiltered)/i,
    severity: "high",
  },
];

export function inspectInput(text: string): { findings: Finding[]; blocked: boolean } {
  const findings = INJECTION_SIGNALS.filter((signal) => signal.pattern.test(text)).map((signal) => ({
    code: signal.code,
    severity: signal.severity,
    detail: `Matched ${signal.code.replaceAll("_", " ")} pattern`,
  }));

  return {
    findings,
    blocked: findings.some((finding) => finding.severity === "high"),
  };
}

type RedactionRule = {
  code: string;
  pattern: string;
  flags: string;
  replacement: string;
};

const REDACTION_RULES: RedactionRule[] = [
  {
    code: "ssn",
    pattern: String.raw`\b\d{3}-\d{2}-\d{4}\b`,
    flags: "g",
    replacement: "[SSN_REDACTED]",
  },
  {
    code: "email",
    pattern: String.raw`\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b`,
    flags: "gi",
    replacement: "[EMAIL_REDACTED]",
  },
  {
    code: "phone",
    pattern: String.raw`\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b`,
    flags: "g",
    replacement: "[PHONE_REDACTED]",
  },
  {
    code: "mrn",
    pattern: String.raw`\bMRN[:#\s-]*[A-Z0-9-]{5,}\b`,
    flags: "gi",
    replacement: "[MRN_REDACTED]",
  },
];

export function redactPII(text: string): { text: string; redactions: string[] } {
  let output = text;
  const redactions: string[] = [];

  for (const rule of REDACTION_RULES) {
    const regex = new RegExp(rule.pattern, rule.flags);
    const matches = output.match(regex);

    if (matches && matches.length > 0) {
      redactions.push(rule.code);
      output = output.replace(regex, rule.replacement);
    }
  }

  return { text: output, redactions: [...new Set(redactions)] };
}

const DISALLOWED_PHRASES = ["as an ai", "i cannot", "system prompt", "ignore previous instructions"];

export type SummaryValidation = {
  issues: string[];
};

export function validateSummary(summary: string, source: string): SummaryValidation {
  const issues: string[] = [];
  const trimmed = summary.trim();

  if (trimmed.length < 40) {
    issues.push("summary_too_short");
  }

  if (trimmed.length > 2000) {
    issues.push("summary_too_long");
  }

  const lower = trimmed.toLowerCase();
  for (const phrase of DISALLOWED_PHRASES) {
    if (lower.includes(phrase)) {
      issues.push(`disallowed_phrase:${phrase.replaceAll(" ", "_")}`);
    }
  }

  const leaked = redactPII(trimmed);
  for (const code of leaked.redactions) {
    issues.push(`pii_leak:${code}`);
  }

  if (source.trim().length > 0 && trimmed.length > source.trim().length) {
    issues.push("summary_longer_than_source");
  }

  return { issues };
}
