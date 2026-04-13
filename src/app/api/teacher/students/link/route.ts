import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRouteSession } from '@/lib/auth/session';

const addLinkSchema = z.object({
  identifier: z.string().trim().min(2).max(120),
});

const deleteLinkSchema = z.object({
  studentId: z.string().uuid(),
});

interface LinkedStudentRow {
  student_id: string;
  student_email: string;
  student_username: string;
  student_display_name: string;
  linked_at: string;
}

export async function POST(request: NextRequest) {
  const auth = await requireRouteSession(['teacher']);
  if ('response' in auth) {
    return auth.response;
  }

  try {
    const body = await request.json();
    const parsed = addLinkSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: '학생 이메일 또는 닉네임을 정확히 입력해 주세요.' },
        { status: 400 }
      );
    }

    const identifier = parsed.data.identifier.trim().toLowerCase();
    const { data, error } = await auth.supabase.rpc('link_student_by_identifier', {
      lookup_identifier: identifier,
    });

    const linkedStudent = (data?.[0] ?? null) as LinkedStudentRow | null;

    if (error || !linkedStudent) {
      return NextResponse.json(
        { error: '학생을 연결하지 못했습니다. 이메일 또는 닉네임을 다시 확인해 주세요.' },
        { status: 400 }
      );
    }

    return NextResponse.json({ linkedStudent });
  } catch (error) {
    console.error('[API] teacher link create error:', error);
    return NextResponse.json(
      { error: '학생 연결 중 문제가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireRouteSession(['teacher']);
  if ('response' in auth) {
    return auth.response;
  }

  try {
    const body = await request.json();
    const parsed = deleteLinkSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: '연결 해제할 학생 정보를 다시 확인해 주세요.' },
        { status: 400 }
      );
    }

    const { error } = await auth.supabase
      .from('teacher_student_links')
      .delete()
      .eq('teacher_id', auth.session.user.id)
      .eq('student_id', parsed.data.studentId);

    if (error) {
      return NextResponse.json(
        { error: '학생 연결을 해제하지 못했습니다.' },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[API] teacher link delete error:', error);
    return NextResponse.json(
      { error: '학생 연결 해제 중 문제가 발생했습니다.' },
      { status: 500 }
    );
  }
}
