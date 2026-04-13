import type { Diagnosis } from '@/types/diagnosis';

export interface AnalysisInput {
  problemImageUrl: string;
  solutionImageUrl?: string | null;
  studentNote: string | null;
  problemImageBase64?: string;
  problemImageMime?: string;
  solutionImageBase64?: string;
  solutionImageMime?: string;
  problemOcrText?: string;
  solutionOcrText?: string;
}

export interface AnalysisResult {
  diagnosis: Diagnosis;
  providerName: string;
  promptVersion: string;
}

export interface DiagnosisProvider {
  name: string;
  analyze(input: AnalysisInput): Promise<AnalysisResult>;
}
