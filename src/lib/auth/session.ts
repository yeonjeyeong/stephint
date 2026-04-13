import 'server-only';

import { NextResponse } from 'next/server';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { canAccessTeacherFeatures, getDefaultRedirectForUser } from './access';
import type { AppRole, AuthSession, ProfileRecord, SessionUser } from './types';
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/db/supabase';

async function getTeacherApprovalState(user: User, role: AppRole) {
  let metadata = user.user_metadata || {};

  if (role === 'teacher') {
    try {
      const admin = createSupabaseAdminClient();
      const { data } = await admin.auth.admin.getUserById(user.id);
      if (data.user?.user_metadata) {
        metadata = data.user.user_metadata;
      }
    } catch (error) {
      console.warn('[Auth] Failed to load latest teacher metadata:', error);
    }
  }

  const adminByEmail = role === 'teacher' && user.email === 'teacher.one@example.com';
  const isTeacherAdmin = role === 'teacher' && (metadata.is_teacher_admin === true || adminByEmail);
  const teacherApproved =
    role === 'teacher' ? metadata.teacher_approved === true || isTeacherAdmin : true;

  return {
    teacherApproved,
    isTeacherAdmin,
  };
}

async function toSessionUser(user: User, profile: ProfileRecord): Promise<SessionUser> {
  const teacherState = await getTeacherApprovalState(user, profile.role);

  return {
    id: profile.id,
    email: profile.email || user.email || '',
    username: profile.username,
    displayName: profile.display_name,
    role: profile.role,
    teacherApproved: teacherState.teacherApproved,
    isTeacherAdmin: teacherState.isTeacherAdmin,
  };
}

async function getProfileForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<ProfileRecord | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, username, display_name, role, created_at, updated_at')
    .eq('id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as ProfileRecord;
}

export async function buildAuthSession(
  supabase: SupabaseClient
): Promise<AuthSession | null> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const profile = await getProfileForUser(supabase, user.id);
  if (!profile) {
    return null;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return {
    user: await toSessionUser(user, profile),
    expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
  };
}

export async function getServerSession() {
  const supabase = await createSupabaseServerClient();
  return buildAuthSession(supabase);
}

export async function requireRouteSession(
  allowedRoles?: AppRole[],
  options?: { allowPendingTeacher?: boolean; requireAdmin?: boolean }
) {
  const supabase = await createSupabaseServerClient();
  const session = await buildAuthSession(supabase);

  if (!session) {
    return {
      supabase,
      response: NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 }),
    };
  }

  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    return {
      supabase,
      response: NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 }),
    };
  }

  if (
    allowedRoles?.includes('teacher') &&
    session.user.role === 'teacher' &&
    !options?.allowPendingTeacher &&
    !canAccessTeacherFeatures(session.user)
  ) {
    return {
      supabase,
      response: NextResponse.json(
        { error: '교사 기능은 관리자 승인 후 사용할 수 있습니다.' },
        { status: 403 }
      ),
    };
  }

  if (options?.requireAdmin && !session.user.isTeacherAdmin) {
    return {
      supabase,
      response: NextResponse.json(
        { error: '교사 계정 승인은 관리자 교사만 처리할 수 있습니다.' },
        { status: 403 }
      ),
    };
  }

  return {
    supabase,
    session,
  };
}

export { getDefaultRedirectForUser };
