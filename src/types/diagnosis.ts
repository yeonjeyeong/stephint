export interface Diagnosis {
  problemType: string;
  progressSummary: string;
  stuckPoint: string;
  misconceptionTags: string[];
  conceptsToReview: string[];
  nextHint: string;
  retryQuestion: string;
  answerRevealed: false;
}

export interface DiagnosisRecord {
  id: string;
  submissionId: string;
  diagnosis: Diagnosis;
  providerName: string;
  promptVersion: string;
  leakageGuardPassed: boolean;
  fallbackUsed: boolean;
  createdAt: string;
}
