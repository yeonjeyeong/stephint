import type { Diagnosis } from '@/types/diagnosis';

export function sanitizeAiText(text: string) {
  let value = text;

  value = value.replace(/\$\$([\s\S]+?)\$\$/g, '$1');
  value = value.replace(/\$([^$]+)\$/g, '$1');
  value = value.replace(/\\\((.*?)\\\)/g, '$1');
  value = value.replace(/\\\[(.*?)\\\]/g, '$1');
  value = value.replace(/\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, '($1)/($2)');
  value = value.replace(/\\lim_\{([^{}]+)\}/g, 'lim($1)');
  value = value.replace(/\\to/g, '→');
  value = value.replace(/\\neq/g, '≠');
  value = value.replace(/\\geq/g, '≥');
  value = value.replace(/\\leq/g, '≤');
  value = value.replace(/\\cdot/g, '·');
  value = value.replace(/\\times/g, '×');
  value = value.replace(/\\left/g, '');
  value = value.replace(/\\right/g, '');
  value = value.replace(/\\text\{([^{}]+)\}/g, '$1');
  value = value.replace(/\^\{([^{}]+)\}/g, '^$1');
  value = value.replace(/_\{([^{}]+)\}/g, '($1)');
  value = value.replace(/\\([A-Za-z]+)/g, '$1');
  value = value.replace(/[{}]/g, '');
  value = value.replace(/\s{2,}/g, ' ').trim();

  return value;
}

export function sanitizeDiagnosisText(diagnosis: Diagnosis): Diagnosis {
  return {
    ...diagnosis,
    problemType: sanitizeAiText(diagnosis.problemType),
    progressSummary: sanitizeAiText(diagnosis.progressSummary),
    stuckPoint: sanitizeAiText(diagnosis.stuckPoint),
    misconceptionTags: diagnosis.misconceptionTags.map(sanitizeAiText),
    conceptsToReview: diagnosis.conceptsToReview.map(sanitizeAiText),
    nextHint: sanitizeAiText(diagnosis.nextHint),
    retryQuestion: sanitizeAiText(diagnosis.retryQuestion),
  };
}
