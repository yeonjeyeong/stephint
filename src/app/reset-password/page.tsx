'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, LockKeyhole, ShieldCheck } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/db/supabase-browser';

function readRecoveryTokens(searchParams: URLSearchParams) {
  if (typeof window === 'undefined') {
    return { accessToken: '', refreshToken: '' };
  }

  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));

  return {
    accessToken: hashParams.get('access_token') || searchParams.get('access_token') || '',
    refreshToken: hashParams.get('refresh_token') || searchParams.get('refresh_token') || '',
  };
}

function getFriendlyRecoveryError(searchParams: URLSearchParams) {
  const error = searchParams.get('error');
  const errorCode = searchParams.get('error_code');
  const description = searchParams.get('error_description');

  if (errorCode === 'otp_expired') {
    return '재설정 링크가 만료되었습니다. 비밀번호 재설정 메일을 다시 요청해 주세요.';
  }

  if (error === 'recovery_failed' || error === 'email_confirmation_failed') {
    return '재설정 링크를 확인하지 못했습니다. 새 메일을 요청한 뒤 가장 최근 링크를 사용해 주세요.';
  }

  if (error === 'recovery_session_missing') {
    return '재설정 세션을 준비하지 못했습니다. 비밀번호 재설정 메일을 다시 요청해 주세요.';
  }

  if (description) {
    return '재설정 링크를 확인하지 못했습니다. 새 메일을 요청한 뒤 가장 최근 링크를 사용해 주세요.';
  }

  return null;
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const tokenSnapshot = useMemo(() => readRecoveryTokens(searchParams), [searchParams]);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(true);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function prepareRecovery() {
      setChecking(true);
      setError(null);

      const recoveryError = getFriendlyRecoveryError(searchParams);
      if (recoveryError) {
        if (!cancelled) {
          setReady(false);
          setError(recoveryError);
          setChecking(false);
        }
        return;
      }

      try {
        if (tokenSnapshot.accessToken && tokenSnapshot.refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: tokenSnapshot.accessToken,
            refresh_token: tokenSnapshot.refreshToken,
          });

          if (sessionError) {
            throw sessionError;
          }

          if (!cancelled) {
            setReady(true);
            setChecking(false);
            window.history.replaceState({}, document.title, '/reset-password');
          }
          return;
        }

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (session) {
          if (!cancelled) {
            setReady(true);
            setChecking(false);
          }
          return;
        }

        if (!cancelled) {
          setReady(false);
          setChecking(false);
          setError('재설정 링크가 없거나 이미 사용되었습니다. 비밀번호 재설정 메일을 다시 요청해 주세요.');
        }
      } catch (prepareError) {
        if (!cancelled) {
          setReady(false);
          setChecking(false);
          setError(
            prepareError instanceof Error
              ? prepareError.message
              : '재설정 링크를 확인하는 중 문제가 발생했습니다.'
          );
        }
      }
    }

    prepareRecovery();
    return () => {
      cancelled = true;
    };
  }, [searchParams, supabase, tokenSnapshot]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);

    if (password !== confirmPassword) {
      setError('비밀번호 확인이 일치하지 않습니다.');
      setSubmitting(false);
      return;
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        throw updateError;
      }

      await supabase.auth.signOut();
      setMessage('비밀번호가 변경되었습니다. 새 비밀번호로 다시 로그인해 주세요.');
      setReady(false);
      setTimeout(() => {
        router.push('/login');
      }, 1200);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : '비밀번호 재설정 중 문제가 발생했습니다.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="gradient-page min-h-screen">
      <div className="mx-auto flex max-w-xl px-5 py-16">
        <div className="glass-card w-full p-8 md:p-10">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-xs font-semibold text-[#ffe3b5]">
            <ShieldCheck size={13} />
            새 비밀번호 설정
          </div>

          <h1 className="mb-3 text-3xl text-white">비밀번호 재설정</h1>
          <p className="mb-6 text-surface-400">
            메일로 받은 링크가 유효하면 바로 새 비밀번호로 바꿀 수 있습니다.
          </p>

          {checking ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-surface-300">
              복구 링크를 확인하고 있습니다...
            </div>
          ) : !ready ? (
            <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-5 text-sm text-red-200">
              {error || '재설정 링크를 사용할 수 없습니다. 다시 메일을 요청해 주세요.'}{' '}
              <Link href="/forgot-password" className="font-semibold underline">
                비밀번호 재설정 메일 요청
              </Link>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="mb-2 block text-sm font-semibold text-surface-200" htmlFor="new-password">
                  새 비밀번호
                </label>
                <input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="새 비밀번호를 입력하세요"
                  className="w-full rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.05)] px-4 py-3 text-sm text-white outline-none transition focus:border-[rgba(255,231,175,0.35)] focus:ring-2 focus:ring-[rgba(255,231,175,0.15)]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-surface-200" htmlFor="confirm-new-password">
                  새 비밀번호 확인
                </label>
                <input
                  id="confirm-new-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="비밀번호를 다시 입력하세요"
                  className="w-full rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.05)] px-4 py-3 text-sm text-white outline-none transition focus:border-[rgba(255,231,175,0.35)] focus:ring-2 focus:ring-[rgba(255,231,175,0.15)]"
                />
              </div>

              {error ? (
                <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              ) : null}

              {message ? (
                <div className="rounded-2xl border border-accent-400/20 bg-accent-400/10 px-4 py-3 text-sm text-accent-100">
                  {message}
                </div>
              ) : null}

              <button type="submit" disabled={submitting} className="btn-primary w-full !py-4">
                {submitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    변경 중...
                  </>
                ) : (
                  <>
                    <LockKeyhole size={18} />
                    새 비밀번호 저장
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-6 text-center text-sm text-surface-400">
            <Link href="/login" className="text-[#ffe3b5] hover:text-white">
              로그인 화면으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
