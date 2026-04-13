import { NextRequest, NextResponse } from 'next/server';
import { buildAuthSession, getDefaultRedirectForUser } from '@/lib/auth/session';
import { createSupabaseServerClient } from '@/lib/db/supabase';

type SupportedEmailOtpType =
  | 'signup'
  | 'invite'
  | 'magiclink'
  | 'recovery'
  | 'email_change'
  | 'email';

const SUPPORTED_EMAIL_OTP_TYPES = new Set<SupportedEmailOtpType>([
  'signup',
  'invite',
  'magiclink',
  'recovery',
  'email_change',
  'email',
]);

function isSupportedEmailOtpType(value: string | null): value is SupportedEmailOtpType {
  return value !== null && SUPPORTED_EMAIL_OTP_TYPES.has(value as SupportedEmailOtpType);
}

function buildRedirectUrl(
  request: NextRequest,
  pathname: string,
  searchParams?: Record<string, string>
) {
  const url = new URL(pathname, request.nextUrl.origin);

  for (const [key, value] of Object.entries(searchParams ?? {})) {
    url.searchParams.set(key, value);
  }

  return url;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const tokenHash = request.nextUrl.searchParams.get('token_hash');
  const type = request.nextUrl.searchParams.get('type');

  const invalidLinkUrl = buildRedirectUrl(request, '/login', {
    error: 'email_confirmation_failed',
  });
  const manualLoginUrl = buildRedirectUrl(request, '/login', {
    auth: 'email_confirmed_manual_login',
  });

  try {
    const supabase = await createSupabaseServerClient();

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        throw error;
      }
    } else if (tokenHash && isSupportedEmailOtpType(type)) {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type,
      });

      if (error) {
        throw error;
      }
    } else {
      return NextResponse.redirect(invalidLinkUrl);
    }

    const session = await buildAuthSession(supabase);
    if (!session) {
      return NextResponse.redirect(manualLoginUrl);
    }

    return NextResponse.redirect(
      buildRedirectUrl(request, getDefaultRedirectForUser(session.user))
    );
  } catch (error) {
    console.error('[Auth] email confirmation failed:', error);
    return NextResponse.redirect(invalidLinkUrl);
  }
}
