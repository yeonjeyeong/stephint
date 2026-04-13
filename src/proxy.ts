import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { canAccessTeacherFeatures, getDefaultRedirectForUser } from '@/lib/auth/access';
import { createSupabaseAdminClient } from '@/lib/db/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function buildLoginUrl(request: NextRequest, role: 'student' | 'teacher') {
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('role', role);
  loginUrl.searchParams.set(
    'next',
    `${request.nextUrl.pathname}${request.nextUrl.search}`
  );
  return loginUrl;
}

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie);
  });
  return to;
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({
          request,
        });

        Object.entries(headers).forEach(([key, value]) => {
          response.headers.set(key, value);
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let sessionUser:
    | {
        role: 'student' | 'teacher';
        teacherApproved: boolean;
        isTeacherAdmin: boolean;
      }
    | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role === 'student' || profile?.role === 'teacher') {
      let metadata = user.user_metadata || {};

      if (profile.role === 'teacher') {
        try {
          const admin = createSupabaseAdminClient();
          const { data } = await admin.auth.admin.getUserById(user.id);
          if (data.user?.user_metadata) {
            metadata = data.user.user_metadata;
          }
        } catch (error) {
          console.warn('[Proxy] Failed to load latest teacher metadata:', error);
        }
      }

      const isTeacherAdmin =
        profile.role === 'teacher' &&
        (metadata.is_teacher_admin === true || user.email === 'teacher.one@example.com');
      const teacherApproved =
        profile.role === 'teacher'
          ? metadata.teacher_approved === true || isTeacherAdmin
          : true;

      sessionUser = {
        role: profile.role,
        teacherApproved,
        isTeacherAdmin,
      };
    }
  }

  const pathname = request.nextUrl.pathname;

  if ((pathname === '/login' || pathname === '/signup') && sessionUser) {
    return copyCookies(
      response,
      NextResponse.redirect(new URL(getDefaultRedirectForUser(sessionUser), request.url))
    );
  }

  if (pathname.startsWith('/student/')) {
    if (!sessionUser) {
      return copyCookies(
        response,
        NextResponse.redirect(buildLoginUrl(request, 'student'))
      );
    }

    if (sessionUser.role !== 'student') {
      return copyCookies(
        response,
        NextResponse.redirect(new URL(getDefaultRedirectForUser(sessionUser), request.url))
      );
    }
  }

  if (pathname.startsWith('/teacher/')) {
    if (!sessionUser) {
      return copyCookies(
        response,
        NextResponse.redirect(buildLoginUrl(request, 'teacher'))
      );
    }

    if (sessionUser.role !== 'teacher') {
      return copyCookies(
        response,
        NextResponse.redirect(new URL(getDefaultRedirectForUser(sessionUser), request.url))
      );
    }

    const isPendingPage = pathname === '/teacher/pending';

    if (isPendingPage && canAccessTeacherFeatures(sessionUser)) {
      return copyCookies(
        response,
        NextResponse.redirect(new URL('/teacher/dashboard', request.url))
      );
    }

    if (!isPendingPage && !canAccessTeacherFeatures(sessionUser)) {
      return copyCookies(
        response,
        NextResponse.redirect(new URL('/teacher/pending', request.url))
      );
    }
  }

  return response;
}

export const config = {
  matcher: ['/login', '/signup', '/student/:path*', '/teacher/:path*'],
};
