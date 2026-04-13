import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { clearAttempts, getRateLimitDecision, recordFailedAttempts } from '@/lib/auth/rate-limit';
import { canAccessTeacherFeatures } from '@/lib/auth/access';
import { buildAuthSession, getDefaultRedirectForUser } from '@/lib/auth/session';
import { createSupabaseServerClient } from '@/lib/db/supabase';

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(128),
  role: z.enum(['student', 'teacher']),
  nextPath: z.string().optional(),
});

function getClientIp(request: NextRequest) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'local'
  );
}

function isSafeRedirect(
  nextPath: string | undefined,
  user: {
    role: 'student' | 'teacher';
    teacherApproved: boolean;
    isTeacherAdmin: boolean;
  }
) {
  if (!nextPath || !nextPath.startsWith('/')) {
    return false;
  }

  if (nextPath.startsWith('//')) {
    return false;
  }

  if (user.role === 'teacher') {
    return canAccessTeacherFeatures(user)
      ? nextPath.startsWith('/teacher/')
      : nextPath.startsWith('/teacher/pending');
  }

  return nextPath.startsWith('/student/');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: '이메일과 비밀번호 형식을 다시 확인해 주세요.' },
        { status: 400 }
      );
    }

    const email = parsed.data.email.trim().toLowerCase();
    const clientIp = getClientIp(request);
    const rateLimitKeys = [`ip:${clientIp}`, `email:${email}`, `pair:${clientIp}:${email}`];
    const rateLimitDecision = getRateLimitDecision(rateLimitKeys);

    if (!rateLimitDecision.allowed) {
      return NextResponse.json(
        {
          error: `로그인 시도가 너무 많습니다. ${rateLimitDecision.retryAfterSeconds}초 후 다시 시도해 주세요.`,
        },
        { status: 429 }
      );
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: parsed.data.password,
    });

    if (error) {
      const failureState = recordFailedAttempts(rateLimitKeys);
      return NextResponse.json(
        {
          error: failureState.allowed
            ? '이메일 또는 비밀번호가 올바르지 않습니다.'
            : `로그인 시도가 너무 많습니다. ${failureState.retryAfterSeconds}초 후 다시 시도해 주세요.`,
        },
        { status: failureState.allowed ? 401 : 429 }
      );
    }

    const session = await buildAuthSession(supabase);
    if (!session) {
      return NextResponse.json(
        { error: '로그인 세션을 생성하지 못했습니다.' },
        { status: 500 }
      );
    }

    if (session.user.role !== parsed.data.role) {
      await supabase.auth.signOut();
      return NextResponse.json(
        { error: '선택한 역할과 계정의 역할이 일치하지 않습니다.' },
        { status: 403 }
      );
    }

    clearAttempts(rateLimitKeys);

    const redirectTo = isSafeRedirect(parsed.data.nextPath, session.user)
      ? parsed.data.nextPath!
      : getDefaultRedirectForUser(session.user);

    return NextResponse.json({
      session,
      redirectTo,
    });
  } catch (error) {
    console.error('[API] login error:', error);
    return NextResponse.json(
      { error: '로그인 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.' },
      { status: 500 }
    );
  }
}
