/**
 * Mock AI provider — returns realistic sample diagnoses
 */

import type { AnalysisInput, AnalysisResult, DiagnosisProvider } from './provider-types';
import { mockDiagnoses } from '@/seed/mock-data';

export class MockProvider implements DiagnosisProvider {
  name = 'mock';

  async analyze(_input: AnalysisInput): Promise<AnalysisResult> {
    void _input;

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Randomly pick a mock diagnosis
    const diagnosis = mockDiagnoses[Math.floor(Math.random() * mockDiagnoses.length)];

    return {
      diagnosis: { ...diagnosis },
      providerName: this.name,
      promptVersion: 'mock-v1',
    };
  }
}
