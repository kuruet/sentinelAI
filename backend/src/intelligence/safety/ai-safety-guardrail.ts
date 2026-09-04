export const AI_SAFETY_DECISIONS = [
  'ALLOW',
  'BLOCK',
] as const;

export type AISafetyDecision =
  (typeof AI_SAFETY_DECISIONS)[number];

export const AI_SAFETY_FINDINGS = [
  'PROMPT_INJECTION',
  'INSTRUCTION_OVERRIDE',
  'SYSTEM_PROMPT_EXTRACTION',
  'ROLE_MANIPULATION',
  'TOOL_EXECUTION_REQUEST',
  'SECRET_REQUEST',
  'UNSAFE_OUTPUT',
] as const;

export type AISafetyFinding =
  (typeof AI_SAFETY_FINDINGS)[number];

export interface AISafetyAssessment {
  decision: AISafetyDecision;
  findings: AISafetyFinding[];
  reasons: string[];
}

export interface AISafetyGuardrailOptions {
  blockOnPromptInjection?: boolean;
  maxInputLength?: number;
  maxOutputLength?: number;
}

export interface AISafetyInput {
  content: string;
  source?: string;
}

const DEFAULT_MAX_INPUT_LENGTH = 200_000;
const DEFAULT_MAX_OUTPUT_LENGTH = 100_000;

const INJECTION_PATTERNS: ReadonlyArray<{
  pattern: RegExp;
  finding: AISafetyFinding;
  reason: string;
}> = [
  {
    pattern: /\b(ignore|disregard|forget|override)\b.{0,80}\b(previous|prior|above|system|developer|assistant|instructions?|rules?)\b/i,
    finding: 'INSTRUCTION_OVERRIDE',
    reason: 'Content attempts to override or disregard higher-priority instructions.',
  },
  {
    pattern: /\b(system prompt|developer message|hidden prompt|secret instructions?|internal instructions?)\b/i,
    finding: 'SYSTEM_PROMPT_EXTRACTION',
    reason: 'Content attempts to obtain protected AI instructions.',
  },
  {
    pattern: /\b(you are now|act as|pretend to be|roleplay as|assume the role)\b/i,
    finding: 'ROLE_MANIPULATION',
    reason: 'Content attempts to manipulate the AI role or operating context.',
  },
  {
    pattern: /\b(reveal|show|print|output|provide|expose)\b.{0,80}\b(system prompt|developer prompt|hidden instructions?|chain[- ]of[- ]thought|private reasoning)\b/i,
    finding: 'SYSTEM_PROMPT_EXTRACTION',
    reason: 'Content requests protected prompts or private reasoning.',
  },
  {
    pattern: /\b(execute|run|invoke|call)\b.{0,80}\b(command|shell|powershell|bash|terminal|tool|function|api)\b/i,
    finding: 'TOOL_EXECUTION_REQUEST',
    reason: 'Content attempts to make the AI execute an operational command or tool.',
  },
  {
    pattern: /\b(reveal|show|print|output|send|provide)\b.{0,80}\b(password|secret|token|api key|credential|access key)\b/i,
    finding: 'SECRET_REQUEST',
    reason: 'Content requests credentials, secrets, or authentication material.',
  },
];

function assessContent(
  input: AISafetyInput,
  options: Required<AISafetyGuardrailOptions>,
): AISafetyAssessment {
  const findings = new Set<AISafetyFinding>();
  const reasons: string[] = [];

  if (input.content.length > options.maxInputLength) {
    reasons.push(
      `Safety input exceeds the maximum permitted length of ${options.maxInputLength} characters.`,
    );
  }

  for (const candidate of INJECTION_PATTERNS) {
    if (!candidate.pattern.test(input.content)) {
      continue;
    }

    findings.add(candidate.finding);

    if (!reasons.includes(candidate.reason)) {
      reasons.push(candidate.reason);
    }
  }

  if (
    findings.has('INSTRUCTION_OVERRIDE') ||
    findings.has('SYSTEM_PROMPT_EXTRACTION') ||
    findings.has('ROLE_MANIPULATION') ||
    findings.has('TOOL_EXECUTION_REQUEST') ||
    findings.has('SECRET_REQUEST')
  ) {
    findings.add('PROMPT_INJECTION');

    if (!reasons.includes(
      'Untrusted content contains an instruction-like pattern that must not be treated as an operational instruction.',
    )) {
      reasons.push(
        'Untrusted content contains an instruction-like pattern that must not be treated as an operational instruction.',
      );
    }
  }

  const decision =
    options.blockOnPromptInjection &&
    findings.has('PROMPT_INJECTION')
      ? 'BLOCK'
      : 'ALLOW';

  return {
    decision,
    findings: [...findings].sort(),
    reasons,
  };
}

export class AISafetyGuardrail {
  private readonly options: Required<AISafetyGuardrailOptions>;

  constructor(options: AISafetyGuardrailOptions = {}) {
    this.options = {
      blockOnPromptInjection:
        options.blockOnPromptInjection ?? true,
      maxInputLength:
        options.maxInputLength ?? DEFAULT_MAX_INPUT_LENGTH,
      maxOutputLength:
        options.maxOutputLength ?? DEFAULT_MAX_OUTPUT_LENGTH,
    };
  }

  assess(input: AISafetyInput): AISafetyAssessment {
    return assessContent(input, this.options);
  }

  assertSafeInput(input: AISafetyInput): AISafetyAssessment {
    const assessment = this.assess(input);

    if (assessment.decision === 'BLOCK') {
      throw new Error(
        `AI safety guardrail blocked untrusted input: ${assessment.reasons.join(' ')}`,
      );
    }

    return assessment;
  }

  assertSafeOutput(output: string): void {
    if (output.length > this.options.maxOutputLength) {
      throw new Error(
        `AI safety guardrail blocked provider output exceeding ${this.options.maxOutputLength} characters.`,
      );
    }

    const protectedOutputPatterns = [
      /\b(system prompt|developer message|hidden prompt|private reasoning)\b/i,
      /\bhere is (the|my) (system|developer) prompt\b/i,
      /\bchain[- ]of[- ]thought\b/i,
    ];

    if (
      protectedOutputPatterns.some((pattern) => pattern.test(output))
    ) {
      throw new Error(
        'AI safety guardrail blocked provider output containing protected prompt or private-reasoning material.',
      );
    }
  }
}
