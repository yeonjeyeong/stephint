import { z } from 'zod';

export const diagnosisSchema = z.object({
  problemType: z.string().min(1, '문제 유형은 필수입니다.'),
  progressSummary: z.string().min(1, '잘한 부분 요약은 필수입니다.'),
  stuckPoint: z.string().min(1, '막힌 지점 설명은 필수입니다.'),
  misconceptionTags: z.array(z.string()).min(1, '오개념 태그를 하나 이상 제공해야 합니다.'),
  conceptsToReview: z.array(z.string()).min(1, '복습 개념을 하나 이상 제공해야 합니다.'),
  nextHint: z.string().min(1, '다음 단계 힌트는 필수입니다.'),
  retryQuestion: z.string().min(1, '재도전 질문은 필수입니다.'),
  answerRevealed: z.literal(false, {
    message: 'answerRevealed must always be false',
  }),
});

export type DiagnosisSchemaType = z.infer<typeof diagnosisSchema>;

export function validateDiagnosis(
  data: unknown
): { success: true; data: DiagnosisSchemaType } | { success: false; errors: string[] } {
  const result = diagnosisSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }

  return {
    success: false,
    errors: result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
  };
}
