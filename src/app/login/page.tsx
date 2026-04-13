'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  GraduationCap,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { getDefaultRedirectForUser } from '@/lib/auth/access';
import { useRole } from '@/context/RoleContext';
import type { AppRole, AuthSession } from '@/lib/auth/types';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { role, user, login, loading } = useRole();
  const roleFromQuery = searchParams.get('role') === 'teacher' ? 'teacher' : 'student';
  const nextPath = searchParams.get('next') || undefined;

  const [selectedRole, setSelectedRole] = useState<AppRole>(roleFromQuery);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedRole(roleFromQuery);
  }, [roleFromQuery]);

  useEffect(() => {
    if (role && user) {
      router.replace(getDefaultRedirectForUser(user));
    }
  }, [role, router, user]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          role: selectedRole,
          nextPath,
        }),
      });

      const data = (await response.json()) as {
        error?: string;
        session?: AuthSession;
        redirectTo?: string;
      };

      if (!response.ok || !data.session || !data.redirectTo) {
        throw new Error(data.error || '로그인에 실패했습니다.');
      }

      login(data.session);
      router.push(data.redirectTo);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '로그인 중 문제가 발생했습니다.');
      setSubmitting(false);
    }
  };

  return (
    <div className="gradient-page min-h-screen">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[1.05fr_0.95fr] md:py-20">
        <section className="glass-card p-8 md:p-10">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-xs font-semibold text-[#ffe3b5]">
            <Sparkles size={13} />
            학생과 교사를 위한 분리 로그인
          </div>

          <h1 className="mb-4 text-4xl text-white md:text-5xl">
            공부 흐름에 맞게
            <br />
            역할을 나눠 들어갑니다
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-surface-400 md:text-lg">
            학생은 자신의 풀이를 올리고, 교사는 연결된 학생의 패턴을 확인합니다.
            같은 서비스 안에서도 필요한 화면만 편하게 보도록 역할을 분리했습니다.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              { title: '학생', desc: '풀이 업로드와 기록 복습에 집중합니다.' },
              { title: '교사', desc: '개입이 필요한 학생과 반복 오개념을 봅니다.' },
              { title: '보안', desc: 'Supabase Auth와 RLS로 접근 권한을 분리합니다.' },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="mb-2 text-sm font-semibold text-white">{item.title}</div>
                <p className="text-sm leading-relaxed text-surface-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-card p-8 md:p-10">
          <div className="mb-6 flex rounded-full border border-white/10 bg-[rgba(255,255,255,0.04)] p-1.5">
            <button
              type="button"
              onClick={() => setSelectedRole('student')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition-all ${
                selectedRole === 'student'
                  ? 'bg-[rgba(121,201,170,0.22)] text-white shadow-[0_8px_20px_rgba(46,92,76,0.2)]'
                  : 'text-surface-400 hover:text-white'
              }`}
            >
              <GraduationCap size={16} />
              학생 로그인
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole('teacher')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition-all ${
                selectedRole === 'teacher'
                  ? 'bg-[rgba(86,140,202,0.22)] text-white shadow-[0_8px_20px_rgba(48,79,121,0.2)]'
                  : 'text-surface-400 hover:text-white'
              }`}
            >
              <Users size={16} />
              교사 로그인
            </button>
          </div>

          <div className="mb-5">
            <h2 className="text-2xl text-white">
              {selectedRole === 'teacher' ? '교사 계정으로 로그인' : '학생 계정으로 로그인'}
            </h2>
            <p className="mt-2 text-sm text-surface-400">
              로그인하면 역할에 맞는 첫 화면으로 바로 이동합니다.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm font-semibold text-surface-200" htmlFor="email">
                이메일
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                placeholder="이메일을 입력하세요"
                className="w-full rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.05)] px-4 py-3 text-sm text-white outline-none transition focus:border-[rgba(255,231,175,0.35)] focus:ring-2 focus:ring-[rgba(255,231,175,0.15)]"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label className="block text-sm font-semibold text-surface-200" htmlFor="password">
                  비밀번호
                </label>
                <Link href="/forgot-password" className="text-xs text-[#ffe3b5] hover:text-white">
                  비밀번호 재설정
                </Link>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                placeholder="비밀번호를 입력하세요"
                className="w-full rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.05)] px-4 py-3 text-sm text-white outline-none transition focus:border-[rgba(255,231,175,0.35)] focus:ring-2 focus:ring-[rgba(255,231,175,0.15)]"
              />
            </div>

            {error ? (
              <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            <button type="submit" disabled={submitting || loading} className="btn-primary w-full !py-4">
              {submitting || loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  로그인 중...
                </>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  로그인
                </>
              )}
            </button>
          </form>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-surface-400">
            <div className="mb-1 flex items-center gap-2 font-semibold text-surface-200">
              <LockKeyhole size={14} className="text-[#ffe3b5]" />
              로그인 팁
            </div>
            교사 화면은 연결된 학생 데이터가 있어야 의미 있게 보입니다. 데모 계정을 사용하면 흐름을 바로 확인할 수 있습니다.
          </div>

          <div className="mt-6 text-center text-sm text-surface-400">
            계정이 없다면{' '}
            <Link href="/signup" className="text-[#ffe3b5] hover:text-white">
              회원가입
            </Link>
            을 진행하세요.
          </div>
        </section>
      </div>
    </div>
  );
}
