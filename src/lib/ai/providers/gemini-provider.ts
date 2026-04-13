import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AnalysisInput, AnalysisResult, DiagnosisProvider } from './provider-types';
import type { Diagnosis } from '@/types/diagnosis';
import { sanitizeDiagnosisText } from '@/lib/ai/format-ai-text';

const MODEL_NAME = 'gemini-3-flash-preview';

const SYSTEM_PROMPT = `당신은 StepHint의 풀이형 학습 코치입니다. 학생이 수학 문제를 풀다가 막힌 지점을 진단하고, 스스로 다음 단계를 생각하도록 돕는 역할만 수행하세요.

절대 규칙:
- 절대 최종 정답을 알려주지 마세요.
- 절대 전체 풀이 과정을 보여주지 마세요.
- "정답은", "답은", "the answer is" 같은 표현을 사용하지 마세요.
- 등호 뒤에 최종 수치나 결론을 적지 마세요.
- 수식은 LaTeX, Markdown 수식 기호, 백슬래시 명령 없이 일반 텍스트로 표현하세요.

해야 할 일:
1. 문제 유형을 분류하세요.
2. 학생이 잘한 부분을 짧게 요약하세요.
3. 막힌 지점을 구체적으로 짚으세요.
4. 오개념 태그를 1~3개 제공하세요.
5. 복습할 개념을 1~3개 추천하세요.
6. 다음 한 단계만 힌트로 제시하세요.
7. 학생이 스스로 다시 시도할 질문을 하나 만드세요.

출력 형식:
다른 설명 없이 아래 JSON 형식으로만 답하세요.
{
  "problemType": "문제 유형",
  "progressSummary": "학생이 잘한 부분",
  "stuckPoint": "막힌 지점",
  "misconceptionTags": ["오개념1"],
  "conceptsToReview": ["복습 개념1"],
  "nextHint": "다음 한 단계 힌트",
  "retryQuestion": "학생이 다시 도전할 질문",
  "answerRevealed": false
}`;

export class GeminiProvider implements DiagnosisProvider {
  name = 'gemini';
  private client: GoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }

    this.client = new GoogleGenerativeAI(apiKey);
  }

  async analyze(input: AnalysisInput): Promise<AnalysisResult> {
    const model = this.client.getGenerativeModel({
      model: MODEL_NAME,
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];
    let userMessage = '아래 자료를 바탕으로 학생의 풀이 상태를 진단하세요.\n\n';
    userMessage += '첫 번째 이미지: 문제 원본\n';

    if (input.solutionImageBase64) {
      userMessage += '두 번째 이미지: 학생 풀이 시도\n';
    } else {
      userMessage += '학생은 아직 풀이 이미지를 올리지 않았고, 문제를 시작하기 전 단계에서 막혀 있을 수 있습니다.\n';
    }

    if (input.problemOcrText) {
      userMessage += `\n[문제 OCR]\n${input.problemOcrText}\n`;
    }
    if (input.solutionOcrText) {
      userMessage += `\n[풀이 OCR]\n${input.solutionOcrText}\n`;
    }
    if (input.studentNote) {
      userMessage += `\n학생 메모: ${input.studentNote}\n`;
    }

    parts.push({ text: `${SYSTEM_PROMPT}\n\n${userMessage}` });

    if (input.problemImageBase64) {
      parts.push({
        inlineData: {
          mimeType: input.problemImageMime || 'image/png',
          data: input.problemImageBase64,
        },
      });
    }

    if (input.solutionImageBase64) {
      parts.push({
        inlineData: {
          mimeType: input.solutionImageMime || 'image/png',
          data: input.solutionImageBase64,
        },
      });
    }

    const result = await model.generateContent(parts);
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('No JSON found in Gemini response');
    }

    const parsed = JSON.parse(jsonMatch[0]) as Diagnosis;
    parsed.answerRevealed = false;

    return {
      diagnosis: sanitizeDiagnosisText(parsed),
      providerName: this.name,
      promptVersion: 'gemini-diagnosis-v5',
    };
  }
}
