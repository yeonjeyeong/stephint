import { NextResponse } from 'next/server';
import { getSubmissionById } from '@/lib/db/queries';
import { requireRouteSession } from '@/lib/auth/session';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRouteSession(['student']);
  if ('response' in auth) {
    return auth.response;
  }

  try {
    const { id } = await params;
    const submission = await getSubmissionById(auth.supabase, id);

    if (!submission || submission.userId !== auth.session.user.id) {
      return NextResponse.json(
        { error: '결과를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      submissionId: submission.id,
      diagnosis: submission.diagnosis,
      status: submission.status,
      createdAt: submission.createdAt,
      studentNote: submission.studentNote,
      problemImageUrl: submission.problemImageUrl,
      solutionImageUrl: submission.solutionImageUrl,
      problemOcrText: submission.problemOcrText,
      solutionOcrText: submission.solutionOcrText,
      providerName: submission.providerName,
      promptVersion: submission.promptVersion,
      fallbackUsed: submission.fallbackUsed,
      leakageGuardPassed: submission.leakageGuardPassed,
    });
  } catch (error) {
    console.error('[API] submission detail error:', error);
    return NextResponse.json(
      { error: '결과를 불러오지 못했습니다.' },
      { status: 500 }
    );
  }
}
