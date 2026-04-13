import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { buildAuthSession, getDefaultRedirectForUser } from '@/lib/auth/session';
import { createSupabaseServerClient } from '@/lib/db/supabase';

const nicknamePattern = /^[A-Za-z0-9가-힣_-]+$/u;

const signupSchema = z
  .object({
    email: z.email(),
    nickname: z.string().trim().min(2).max(24).regex(nicknamePattern).optional(),
    username: z.string().trim().min(2).max(24).regex(nicknamePattern).optional(),
    displayName: z.string().trim().min(2).max(40),
    role: z.enum(['student', 'teacher']),
    password: z
      .string()
      .min(8)
      .max(128)
      .regex(/[a-zA-Z]/)
      .regex(/[0-9]/)
      .regex(/[^a-zA-Z0-9]/),
  })
  .superRefine((value, ctx) => {
    if (!value.nickname && !value.username) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['nickname'],
        message: '닉네임은 필수입니다.',
      });
    }
  });

function getSignupValidationMessage(error: z.ZodError) {
  const issue = error.issues[0];
  if (!issue) {
    return '입력한 정보를 다시 확인해 주세요.';
  }

  const field = issue.path[0];

  if (field === 'email') {
    return '올바른 이메일 주소를 입력해 주세요.';
  }

  if (field === 'displayName') {
    return '이름은 2자 이상 40자 이하로 입력해 주세요.';
  }

  if (field === 'nickname' || field === 'username') {
    return '닉네임은 한글, 영문, 숫자, 밑줄(_), 하이픈(-)만 사용할 수 있습니다.';
  }

  if (field === 'password') {
    return '비밀번호는 8자 이상이며 영문, 숫자, 특수문자를 모두 포함해야 합니다.';
  }

  return '입력한 정보를 다시 확인해 주세요.';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: getSignupValidationMessage(parsed.error) },
        { status: 400 }
      );
    }

    const nickname = (parsed.data.nickname || parsed.data.username || '').trim();
    const emailRedirectTo = new URL('/auth/confirm', request.nextUrl.origin).toString();
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email.trim().toLowerCase(),
      password: parsed.data.password,
      options: {
        emailRedirectTo,
        data: {
          username: nickname,
          display_name: parsed.data.displayName.trim(),
          role: parsed.data.role,
          teacher_approved: parsed.data.role === 'teacher' ? false : true,
          is_teacher_admin: false,
        },
      },
    });

    if (error) {
      return NextResponse.json(
        {
          error:
            error.message.includes('duplicate key') || error.message.includes('username')
              ? '이미 사용 중인 닉네임입니다.'
              : error.message.includes('already registered')
                ? '이미 가입된 이메일입니다.'
                : '회원가입 중 문제가 발생했습니다.',
        },
        { status: 400 }
      );
    }

    if (!data.session) {
      return NextResponse.json({
        needsEmailConfirmation: true,
        message: '이메일 인증 메일을 보냈습니다. 메일의 버튼을 누르면 자동으로 로그인됩니다.',
      });
    }

    const session = await buildAuthSession(supabase);
    if (!session) {
      return NextResponse.json(
        { error: '회원가입은 완료됐지만 세션을 확인하지 못했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      session,
      redirectTo: getDefaultRedirectForUser(session.user),
    });
  } catch (error) {
    console.error('[API] signup error:', error);
    return NextResponse.json(
      { error: '회원가입 중 문제가 발생했습니다.' },
      { status: 500 }
    );
  }
}
