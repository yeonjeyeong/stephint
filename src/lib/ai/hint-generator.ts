import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Diagnosis } from '@/types/diagnosis';
import { checkAnswerLeakage, getSafeFallbackHint } from './guards/answer-leak-guard';
import { sanitizeAiText } from './format-ai-text';

const MODEL_NAME = 'gemini-3-flash-preview';
const PROMPT_VERSION = 'gemini-hint-v3';

export interface HintGenerationInput {
  diagnosis: Diagnosis;
  studentNote?: string | null;
  problemOcrText?: string | null;
  solutionOcrText?: string | null;
}

export interface HintGenerationResult {
  hintText: string;
  providerName: string;
  promptVersion: string;
  fallbackUsed: boolean;
  leakageGuardPassed: boolean;
}

function createFallbackHint(reason: string): HintGenerationResult {
  return {
    hintText: sanitizeAiText(
      '막힌 줄 바로 앞 단계에서 어떤 규칙을 사용했는지 먼저 말로 설명해 보고, 같은 규칙을 한 줄만 다시 적용해 보세요.'
    ),
    providerName: 'gemini',
    promptVersion: `${PROMPT_VERSION}:${reason}`,
    fallbackUsed: true,
    leakageGuardPassed: true,
  };
}

export async function generateSecondStepHint(
  input: HintGenerationInput
): Promise<HintGenerationResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return createFallbackHint('missing-key');
  }

  try {
    const client = new GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({ model: MODEL_NAME });
    const prompt = `당신은 StepHint의 2단계 힌트 생성기입니다.

규칙:
- 절대 정답을 말하지 마세요.
- 절대 전체 풀이를 보여주지 마세요.
- 이미 제공한 1단계 힌트보다 약간 더 구체적인 한 단락만 작성하세요.
- 수식은 LaTeX, Markdown 수식 기호, 백슬래시 명령을 쓰지 말고 일반 텍스트로 표현하세요.
- 예: "$a$" 대신 "a", "$f(1)$" 대신 "f(1)", "\\lim_{x \\to 1}" 대신 "x가 1로 갈 때의 극한"처럼 적으세요.

학생 진단 정보:
- 문제 유형: ${input.diagnosis.problemType}
- 잘한 부분: ${input.diagnosis.progressSummary}
- 막힌 지점: ${input.diagnosis.stuckPoint}
- 오개념 태그: ${input.diagnosis.misconceptionTags.join(', ')}
- 복습 개념: ${input.diagnosis.conceptsToReview.join(', ')}
- 기존 1단계 힌트: ${input.diagnosis.nextHint}
- 재도전 질문: ${input.diagnosis.retryQuestion}
${input.studentNote ? `- 학생 메모: ${input.studentNote}` : ''}
${input.problemOcrText ? `- 문제 OCR: ${input.problemOcrText}` : ''}
${input.solutionOcrText ? `- 풀이 OCR: ${input.solutionOcrText}` : ''}

출력 형식:
- 한국어 한 단락만 작성하세요.
- 학생이 스스로 다음 줄을 써볼 수 있게 코칭하세요.`;

    const result = await model.generateContent(prompt);
    const hintText = sanitizeAiText(result.response.text().trim());

    if (!hintText) {
      return createFallbackHint('empty-response');
    }

    const guardResult = checkAnswerLeakage({
      progressSummary: '',
      stuckPoint: '',
      nextHint: hintText,
      retryQuestion: '',
    });

    if (!guardResult.passed) {
      return {
        hintText: sanitizeAiText(getSafeFallbackHint()),
        providerName: 'gemini',
        promptVersion: `${PROMPT_VERSION}:guard`,
        fallbackUsed: true,
        leakageGuardPassed: false,
      };
    }

    return {
      hintText,
      providerName: 'gemini',
      promptVersion: PROMPT_VERSION,
      fallbackUsed: false,
      leakageGuardPassed: true,
    };
  } catch (error) {
    console.error('[HintGenerator] Error:', error);
    return createFallbackHint('provider-error');
  }
}
