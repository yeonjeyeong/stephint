/**
 * Answer leakage guard
 * Multi-layered check to ensure no final answers or full solutions are exposed.
 */

/** Banned phrases — if any appears in the text, it's flagged as a leak. */
const BANNED_PATTERNS: RegExp[] = [
  // English patterns
  /the answer is/i,
  /final answer/i,
  /the solution is/i,
  /the result is/i,
  /equals?\s+\d+/i,       // "equals 42" or "equal 42"
  /=\s*-?\d+(\.\d+)?$/m,   // lines ending with "= 42"
  // Korean patterns
  /정답은/,
  /답은\s/,
  /답:\s/,
  /최종\s*답/,
  /풀이\s*결과/,
  /결과는\s/,
  /따라서\s.*=\s*-?\d/,     // "따라서 x = 5"
];

/** Heuristic: detect multi-step full derivations (3+ consecutive numbered steps) */
const FULL_DERIVATION_PATTERN = /(?:(?:step|단계)\s*\d+[\s\S]*?){3,}/i;

export interface GuardResult {
  passed: boolean;
  reason?: string;
}

/**
 * Check a diagnosis object's text fields for answer leakage.
 */
export function checkAnswerLeakage(diagnosis: {
  progressSummary: string;
  stuckPoint: string;
  nextHint: string;
  retryQuestion: string;
  [key: string]: unknown;
}): GuardResult {
  const fieldsToCheck = [
    { name: 'progressSummary', value: diagnosis.progressSummary },
    { name: 'stuckPoint', value: diagnosis.stuckPoint },
    { name: 'nextHint', value: diagnosis.nextHint },
    { name: 'retryQuestion', value: diagnosis.retryQuestion },
  ];

  for (const field of fieldsToCheck) {
    // Check banned patterns
    for (const pattern of BANNED_PATTERNS) {
      if (pattern.test(field.value)) {
        return {
          passed: false,
          reason: `Leakage detected in "${field.name}": matched pattern "${pattern.source}"`,
        };
      }
    }

    // Check full derivation
    if (FULL_DERIVATION_PATTERN.test(field.value)) {
      return {
        passed: false,
        reason: `Full derivation detected in "${field.name}"`,
      };
    }
  }

  return { passed: true };
}

/** Safe fallback coaching messages when leakage is detected */
const FALLBACK_MESSAGES = [
  '이 문제에서 사용된 핵심 개념을 다시 한번 확인해 보세요. 규칙을 정리한 후 풀이에 적용해 보면 돌파구가 보일 거예요.',
  '지금까지 시도한 방법은 좋은 출발이에요. 한 단계 전으로 돌아가서 조건을 다시 정리해 보세요.',
  '비슷한 문제를 한 번 먼저 풀어보면 이 문제의 핵심이 더 잘 보일 수 있어요. 기본 개념부터 확인해 보세요.',
];

export function getSafeFallbackHint(): string {
  return FALLBACK_MESSAGES[Math.floor(Math.random() * FALLBACK_MESSAGES.length)];
}
