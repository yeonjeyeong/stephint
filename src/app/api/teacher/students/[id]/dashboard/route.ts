import { NextResponse } from 'next/server';
import { getTeacherStudentDashboard } from '@/lib/db/queries';
import { requireRouteSession } from '@/lib/auth/session';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRouteSession(['teacher']);
  if ('response' in auth) {
    return auth.response;
  }

  try {
    const { id } = await params;
    const dashboard = await getTeacherStudentDashboard(auth.supabase, id);

    if (!dashboard) {
      return NextResponse.json(
        { error: '학생 대시보드를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json(dashboard);
  } catch (error) {
    console.error('[API] teacher student dashboard error:', error);
    return NextResponse.json(
      { error: '학생 대시보드를 불러오지 못했습니다.' },
      { status: 500 }
    );
  }
}
