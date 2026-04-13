import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/db/supabase';

const forgotPasswordSchema = z.object({
  email: z.email(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: '유효한 이메일을 입력해 주세요.' },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();
    const redirectTo = `${request.nextUrl.origin}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(
      parsed.data.email.trim().toLowerCase(),
      { redirectTo }
    );

    if (error) {
      return NextResponse.json(
        { error: '비밀번호 재설정 메일을 보내지 못했습니다.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: '비밀번호 재설정 링크를 이메일로 보냈습니다.',
    });
  } catch (error) {
    console.error('[API] forgot-password error:', error);
    return NextResponse.json(
      { error: '재설정 요청 중 문제가 발생했습니다.' },
      { status: 500 }
    );
  }
}
