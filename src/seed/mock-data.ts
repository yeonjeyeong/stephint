import type { Diagnosis } from '@/types/diagnosis';

export const mockDiagnoses: Diagnosis[] = [
  {
    problemType: '일차방정식',
    progressSummary:
      '방정식의 양변을 정리하고 미지수를 한쪽으로 모으는 과정까지는 잘 진행했습니다.',
    stuckPoint:
      '항을 이항할 때 부호가 바뀌어야 하는데, 그대로 이동한 것으로 보입니다.',
    misconceptionTags: ['부호 오류', '이항 규칙 혼동'],
    conceptsToReview: ['등식의 성질', '음수 연산'],
    nextHint:
      '항을 반대편으로 옮길 때 부호가 어떻게 바뀌는지 먼저 말로 설명해 보세요.',
    retryQuestion:
      '2x + 5 = 11에서 5를 오른쪽으로 옮기면 식이 어떻게 바뀌나요?',
    answerRevealed: false,
  },
  {
    problemType: '이차방정식',
    progressSummary:
      '인수분해를 시도했고, 합과 곱의 관계를 활용하려는 접근이 보입니다.',
    stuckPoint:
      '두 수의 합과 곱을 혼동하고 있어 인수분해 조합이 맞지 않는 것 같습니다.',
    misconceptionTags: ['인수분해 오개념', '합-곱 관계 혼동'],
    conceptsToReview: ['인수분해 공식', '이차식 구조'],
    nextHint:
      '(x + a)(x + b) 형태에서 a+b와 a*b가 원래 식의 어디에 대응되는지 다시 확인해 보세요.',
    retryQuestion:
      'x^2 + 5x + 6을 인수분해할 때 곱이 6이고 합이 5인 두 수는 무엇인가요?',
    answerRevealed: false,
  },
  {
    problemType: '연립방정식',
    progressSummary:
      '소거법을 적용하려는 방향은 맞았고, 두 식을 정리하는 과정도 비교적 안정적입니다.',
    stuckPoint:
      '한 변수를 없애기 위해 맞춰야 할 계수를 잘못 선택해 소거가 되지 않았습니다.',
    misconceptionTags: ['소거법 절차 오류', '계수 맞추기 실수'],
    conceptsToReview: ['소거법 절차', '최소공배수 활용'],
    nextHint:
      '없애려는 변수의 계수를 같게 만들려면 각 식에 어떤 수를 곱해야 할지 먼저 정해 보세요.',
    retryQuestion:
      '2x + 3y = 12와 4x + y = 10에서 x를 소거하려면 첫 번째 식에 무엇을 곱해야 하나요?',
    answerRevealed: false,
  },
];
