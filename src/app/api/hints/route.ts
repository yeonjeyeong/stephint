import { NextRequest, NextResponse } from 'next/server';
import { generateSecondStepHint } from '@/lib/ai/hint-generator';
import { getSubmissionById } from '@/lib/db/queries';
import { requireRouteSession } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  const auth = await requireRouteSession(['student']);
  if ('response' in auth) {
    return auth.response;
  }

  try {
    const body = await request.json();
    const submissionId = body?.submissionId as string | undefined;
    const hintLevel = body?.hintLevel as number | undefined;

    if (!submissionId) {
      return NextResponse.json(
        { error: '제출 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    if ((hintLevel ?? 1) > 2) {
      return NextResponse.json(
        { error: '추가 힌트는 2단계까지만 제공합니다.' },
        { status: 400 }
      );
    }

    const submission = await getSubmissionById(auth.supabase, submissionId);
    if (!submission || submission.userId !== auth.session.user.id || !submission.diagnosis) {
      return NextResponse.json(
        { error: '해당 제출을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const result = await generateSecondStepHint({
      diagnosis: submission.diagnosis,
      studentNote: submission.studentNote,
      problemOcrText: submission.problemOcrText,
      solutionOcrText: submission.solutionOcrText,
    });

    return NextResponse.json({
      submissionId,
      hintLevel: 2,
      hintText: result.hintText,
      providerName: result.providerName,
      promptVersion: result.promptVersion,
      fallbackUsed: result.fallbackUsed,
      leakageGuardPassed: result.leakageGuardPassed,
    });
  } catch (error) {
    console.error('[API] hints error:', error);
    return NextResponse.json(
      { error: '힌트 생성 중 문제가 발생했습니다.' },
      { status: 500 }
    );
  }
}
