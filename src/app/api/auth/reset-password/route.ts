import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const resetPasswordSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  password: z
    .string()
    .min(8)
    .max(128)
    .regex(/[a-zA-Z]/)
    .regex(/[0-9]/)
    .regex(/[^a-zA-Z0-9]/),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: '새 비밀번호 형식을 확인해 주세요.' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: parsed.data.accessToken,
      refresh_token: parsed.data.refreshToken,
    });

    if (sessionError) {
      return NextResponse.json(
        { error: '재설정 링크가 만료되었거나 유효하지 않습니다.' },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: parsed.data.password,
    });

    if (updateError) {
      return NextResponse.json(
        { error: '비밀번호를 변경하지 못했습니다.' },
        { status: 400 }
      );
    }

    await supabase.auth.signOut();

    return NextResponse.json({
      ok: true,
      message: '비밀번호가 변경되었습니다. 새 비밀번호로 다시 로그인해 주세요.',
    });
  } catch (error) {
    console.error('[API] reset-password error:', error);
    return NextResponse.json(
      { error: '비밀번호 재설정 중 문제가 발생했습니다.' },
      { status: 500 }
    );
  }
}
