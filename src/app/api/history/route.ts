import { NextResponse } from 'next/server';
import { getStudentHistory } from '@/lib/db/queries';
import { requireRouteSession } from '@/lib/auth/session';

export async function GET() {
  const auth = await requireRouteSession(['student']);
  if ('response' in auth) {
    return auth.response;
  }

  try {
    const submissions = await getStudentHistory(auth.supabase, auth.session.user.id);
    return NextResponse.json({ submissions });
  } catch (error) {
    console.error('[API] history error:', error);
    return NextResponse.json(
      { error: '학습 이력을 불러오지 못했습니다.' },
      { status: 500 }
    );
  }
}
