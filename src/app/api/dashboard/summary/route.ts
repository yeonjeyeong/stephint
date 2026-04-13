import { NextResponse } from 'next/server';
import { getTeacherDashboardSummary } from '@/lib/db/queries';
import { requireRouteSession } from '@/lib/auth/session';
import { createSupabaseAdminClient } from '@/lib/db/supabase';
import type { PendingTeacherApproval } from '@/types/submission';

export async function GET() {
  const auth = await requireRouteSession(['teacher']);
  if ('response' in auth) {
    return auth.response;
  }

  try {
    const summary = await getTeacherDashboardSummary(auth.supabase);
    let pendingTeacherApprovals: PendingTeacherApproval[] = [];

    if (auth.session.user.isTeacherAdmin) {
      const admin = createSupabaseAdminClient();
      const { data, error } = await admin.auth.admin.listUsers({
        page: 1,
        perPage: 200,
      });

      if (error) {
        throw error;
      }

      pendingTeacherApprovals = (data.users ?? [])
        .filter((teacher) => {
          const metadata = teacher.user_metadata || {};
          const isTeacherAdmin =
            metadata.is_teacher_admin === true || teacher.email === 'teacher.one@example.com';
          const teacherApproved =
            metadata.teacher_approved === true || isTeacherAdmin;

          return (
            metadata.role === 'teacher' &&
            !isTeacherAdmin &&
            !teacherApproved
          );
        })
        .map((teacher) => {
          const metadata = teacher.user_metadata || {};

          return {
            id: teacher.id,
            email: teacher.email || '',
            username: typeof metadata.username === 'string' ? metadata.username : '',
            displayName:
              typeof metadata.display_name === 'string'
                ? metadata.display_name
                : teacher.email?.split('@')[0] || 'Teacher',
            createdAt: teacher.created_at,
          } satisfies PendingTeacherApproval;
        });
    }

    return NextResponse.json({
      ...summary,
      isTeacherAdmin: auth.session.user.isTeacherAdmin,
      pendingTeacherApprovals,
    });
  } catch (error) {
    console.error('[API] dashboard summary error:', error);
    return NextResponse.json(
      { error: '교사 대시보드를 불러오지 못했습니다.' },
      { status: 500 }
    );
  }
}
