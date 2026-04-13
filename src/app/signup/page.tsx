'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  GraduationCap,
  Loader2,
  ShieldCheck,
  Sparkles,
  UserPlus2,
  Users,
} from 'lucide-react';
import { getDefaultRedirectForUser } from '@/lib/auth/access';
import { useRole } from '@/context/RoleContext';
import type { AppRole, AuthSession } from '@/lib/auth/types';

const nicknamePattern = /^[A-Za-z0-9가-힣ㄱ-ㅎㅏ-ㅣ._-]+$/u;

export default function SignupPage() {
  const router = useRouter();
  const { role, user, login } = useRole();

  const [selectedRole, setSelectedRole] = useState<AppRole>('student');
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (role && user) {
      router.replace(getDefaultRedirectForUser(user));
    }
  }, [role, router, user]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);

    if (displayName.trim().length < 2 || displayName.trim().length > 40) {
      setError('이름은 2자 이상 40자 이하로 입력해 주세요.');
      setSubmitting(false);
      return;
    }

    if (!email.includes('@')) {
      setError('올바른 이메일 주소를 입력해 주세요.');
      setSubmitting(false);
      return;
    }

    if (nickname.trim().length < 2 || nickname.trim().length > 24) {
      setError('닉네임은 2자 이상 24자 이하로 입력해 주세요.');
      setSubmitting(false);
      return;
    }

    if (!nicknamePattern.test(nickname.trim())) {
      setError('닉네임은 한글, 영문, 숫자, 점(.), 밑줄(_), 하이픈(-)만 사용할 수 있습니다.');
      setSubmitting(false);
      return;
    }

    if (
      !/[a-zA-Z]/.test(password) ||
      !/[0-9]/.test(password) ||
      !/[^a-zA-Z0-9]/.test(password) ||
      password.length < 8
    ) {
      setError('비밀번호는 8자 이상이며 영문, 숫자, 특수문자를 모두 포함해야 합니다.');
      setSubmitting(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('비밀번호 확인이 일치하지 않습니다.');
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          nickname,
          displayName,
          password,
          role: selectedRole,
        }),
      });

      const data = (await response.json()) as {
        error?: string;
        message?: string;
        needsEmailConfirmation?: boolean;
        session?: AuthSession;
        redirectTo?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || '회원가입에 실패했습니다.');
      }

      if (data.needsEmailConfirmation) {
        setMessage(data.message || '이메일 인증 후 로그인해 주세요.');
        setSubmitting(false);
        return;
      }

      if (!data.session || !data.redirectTo) {
        throw new Error('회원가입은 완료되었지만 세션을 확인하지 못했습니다.');
      }

      login(data.session);
      router.push(data.redirectTo);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '회원가입 중 문제가 발생했습니다.');
      setSubmitting(false);
    }
  };

  return (
    <div className="gradient-page min-h-screen">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[1.1fr_0.9fr] md:py-20">
        <section className="glass-card p-8 md:p-10">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-xs font-semibold text-[#ffe3b5]">
            <Sparkles size={13} />
            StepHint 데모 계정 만들기
          </div>

          <h1 className="mb-4 text-4xl text-white md:text-5xl">
            학생과 교사를 위한
            <br />
            회원가입
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-surface-400 md:text-lg">
            역할, 이메일, 닉네임, 이름만 입력하면 바로 시작할 수 있습니다.
          </p>
        </section>

        <section className="glass-card p-8 md:p-10">
          <div className="mb-6 flex rounded-full border border-white/10 bg-[rgba(255,255,255,0.04)] p-1.5">
            <button
              type="button"
              onClick={() => setSelectedRole('student')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition-all ${
                selectedRole === 'student'
                  ? 'bg-[rgba(121,201,170,0.22)] text-white'
                  : 'text-surface-400 hover:text-white'
              }`}
            >
              <GraduationCap size={16} />
              학생 가입
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole('teacher')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition-all ${
                selectedRole === 'teacher'
                  ? 'bg-[rgba(86,140,202,0.22)] text-white'
                  : 'text-surface-400 hover:text-white'
              }`}
            >
              <Users size={16} />
              교사 가입
            </button>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm font-semibold text-surface-200" htmlFor="displayName">
                이름
              </label>
              <input
                id="displayName"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="이름을 입력하세요"
                className="w-full rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.05)] px-4 py-3 text-sm text-white outline-none transition focus:border-[rgba(255,231,175,0.35)] focus:ring-2 focus:ring-[rgba(255,231,175,0.15)]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-surface-200" htmlFor="signup-email">
                이메일
              </label>
              <input
                id="signup-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="이메일을 입력하세요"
                className="w-full rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.05)] px-4 py-3 text-sm text-white outline-none transition focus:border-[rgba(255,231,175,0.35)] focus:ring-2 focus:ring-[rgba(255,231,175,0.15)]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-surface-200" htmlFor="nickname">
                닉네임
              </label>
              <input
                id="nickname"
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
                placeholder="닉네임을 입력하세요"
                className="w-full rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.05)] px-4 py-3 text-sm text-white outline-none transition focus:border-[rgba(255,231,175,0.35)] focus:ring-2 focus:ring-[rgba(255,231,175,0.15)]"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-surface-200" htmlFor="signup-password">
                  비밀번호
                </label>
                <input
                  id="signup-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  className="w-full rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.05)] px-4 py-3 text-sm text-white outline-none transition focus:border-[rgba(255,231,175,0.35)] focus:ring-2 focus:ring-[rgba(255,231,175,0.15)]"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-surface-200" htmlFor="confirmPassword">
                  비밀번호 확인
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="비밀번호를 다시 입력하세요"
                  className="w-full rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.05)] px-4 py-3 text-sm text-white outline-none transition focus:border-[rgba(255,231,175,0.35)] focus:ring-2 focus:ring-[rgba(255,231,175,0.15)]"
                />
              </div>
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
                  가입 중...
                </>
              ) : (
                <>
                  <UserPlus2 size={18} />
                  회원가입
                </>
              )}
            </button>
          </form>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-surface-400">
            <div className="mb-1 flex items-center gap-2 font-semibold text-surface-200">
              <ShieldCheck size={14} className="text-[#ffe3b5]" />
              안내
            </div>
            로그인 후에는 선택한 역할에 맞는 첫 화면으로 바로 이동합니다.
          </div>

          <div className="mt-6 text-center text-sm text-surface-400">
            이미 계정이 있다면{' '}
            <Link href="/login" className="text-[#ffe3b5] hover:text-white">
              로그인
            </Link>
            을 진행하세요.
          </div>
        </section>
      </div>
    </div>
  );
}
