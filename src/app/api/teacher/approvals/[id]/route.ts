import { NextResponse } from 'next/server';
import { requireRouteSession } from '@/lib/auth/session';
import { createSupabaseAdminClient } from '@/lib/db/supabase';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRouteSession(['teacher'], { requireAdmin: true });
  if ('response' in auth) {
    return auth.response;
  }

  try {
    const { id } = await params;
    const admin = createSupabaseAdminClient();
    const { data: targetTeacher, error: getError } = await admin.auth.admin.getUserById(id);

    if (getError || !targetTeacher.user) {
      return NextResponse.json(
        { error: '교사 계정을 찾지 못했습니다.' },
        { status: 404 }
      );
    }

    const metadata = targetTeacher.user.user_metadata || {};
    if (metadata.role !== 'teacher') {
      return NextResponse.json(
        { error: '교사 계정만 승인할 수 있습니다.' },
        { status: 400 }
      );
    }

    const { data, error } = await admin.auth.admin.updateUserById(id, {
      user_metadata: {
        ...metadata,
        teacher_approved: true,
      },
    });

    if (error || !data.user) {
      return NextResponse.json(
        { error: '교사 계정을 승인하지 못했습니다.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      approvedTeacher: {
        id: data.user.id,
        email: data.user.email || '',
      },
    });
  } catch (error) {
    console.error('[API] teacher approval error:', error);
    return NextResponse.json(
      { error: '교사 계정 승인 중 문제가 발생했습니다.' },
      { status: 500 }
    );
  }
}
