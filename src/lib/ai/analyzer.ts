import type { AnalysisInput, DiagnosisProvider } from './providers/provider-types';
import type { Diagnosis } from '@/types/diagnosis';
import { MockProvider } from './providers/mock-provider';
import { validateDiagnosis } from './schemas/diagnosis-schema';
import { checkAnswerLeakage, getSafeFallbackHint } from './guards/answer-leak-guard';

function getProvider(): DiagnosisProvider {
  const providerName = (process.env.AI_PROVIDER || 'gemini').trim().toLowerCase();

  if (providerName === 'mock') {
    return new MockProvider();
  }

  if (providerName === 'gemini') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { GeminiProvider } = require('./providers/gemini-provider');
    return new GeminiProvider();
  }

  throw new Error(`Unsupported AI provider "${providerName}"`);
}

export interface AnalyzerResult {
  diagnosis: Diagnosis;
  providerName: string;
  promptVersion: string;
  leakageGuardPassed: boolean;
  fallbackUsed: boolean;
}

export async function analyzeSolution(input: AnalysisInput): Promise<AnalyzerResult> {
  let provider: DiagnosisProvider;

  try {
    provider = getProvider();
  } catch (error) {
    console.error('[Analyzer] Provider initialization failed:', error);
    return createFallbackResult(process.env.AI_PROVIDER || 'gemini', 'provider-init', false);
  }

  let raw;
  try {
    raw = await provider.analyze(input);
  } catch (error) {
    console.error('[Analyzer] Provider error, using fallback:', error);
    return createFallbackResult(provider.name, 'provider-error', false);
  }

  const validation = validateDiagnosis(raw.diagnosis);
  if (!validation.success) {
    console.error('[Analyzer] Schema validation failed:', validation.errors);
    return createFallbackResult(raw.providerName, `${raw.promptVersion}:schema`, true);
  }

  const guardResult = checkAnswerLeakage(validation.data);
  if (!guardResult.passed) {
    const safeDiagnosis: Diagnosis = {
      problemType: validation.data.problemType,
      progressSummary: validation.data.progressSummary,
      stuckPoint: validation.data.stuckPoint,
      misconceptionTags: validation.data.misconceptionTags,
      conceptsToReview: validation.data.conceptsToReview,
      nextHint: getSafeFallbackHint(),
      retryQuestion:
        '문제의 핵심 개념을 다시 정리하고, 막히기 직전 단계까지만 스스로 다시 써볼 수 있을까요?',
      answerRevealed: false,
    };

    return {
      diagnosis: safeDiagnosis,
      providerName: raw.providerName,
      promptVersion: raw.promptVersion,
      leakageGuardPassed: false,
      fallbackUsed: true,
    };
  }

  return {
    diagnosis: {
      problemType: validation.data.problemType,
      progressSummary: validation.data.progressSummary,
      stuckPoint: validation.data.stuckPoint,
      misconceptionTags: validation.data.misconceptionTags,
      conceptsToReview: validation.data.conceptsToReview,
      nextHint: validation.data.nextHint,
      retryQuestion: validation.data.retryQuestion,
      answerRevealed: false,
    },
    providerName: raw.providerName,
    promptVersion: raw.promptVersion,
    leakageGuardPassed: true,
    fallbackUsed: false,
  };
}

function createFallbackResult(
  providerName: string,
  promptVersion: string,
  leakageGuardPassed: boolean
): AnalyzerResult {
  return {
    diagnosis: {
      problemType: '풀이 진단',
      progressSummary: '문제를 풀기 위해 시도한 흔적은 확인했지만, 현재 정보만으로는 흐름이 충분하지 않습니다.',
      stuckPoint: '입력된 정보만으로는 어디에서 막혔는지 분명하게 특정하기 어려웠습니다.',
      misconceptionTags: [],
      conceptsToReview: ['문제 조건 정리', '직전 단계 점검'],
      nextHint: getSafeFallbackHint(),
      retryQuestion:
        '문제 조건을 다시 읽고, 마지막으로 확신했던 단계부터 어디까지 맞는지 적어볼 수 있을까요?',
      answerRevealed: false,
    },
    providerName,
    promptVersion,
    leakageGuardPassed,
    fallbackUsed: true,
  };
}
