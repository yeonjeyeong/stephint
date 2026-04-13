'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, Mail, ShieldCheck } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        throw new Error(data.error || '재설정 요청에 실패했습니다.');
      }

      setMessage(data.message || '비밀번호 재설정 메일을 보냈습니다.');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '재설정 요청 중 문제가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="gradient-page min-h-screen">
      <div className="mx-auto flex max-w-xl px-5 py-16">
        <div className="glass-card w-full p-8 md:p-10">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-500/15 bg-brand-500/10 px-4 py-1.5 text-xs font-semibold text-brand-400">
            <ShieldCheck size={13} />
            비밀번호 재설정
          </div>

          <h1 className="mb-3 text-3xl font-bold text-white">재설정 메일 보내기</h1>
          <p className="mb-6 text-surface-400">
            가입에 사용한 이메일을 입력하면 비밀번호를 다시 설정할 수 있는 링크를 보내드립니다.
          </p>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm font-semibold text-surface-300" htmlFor="forgot-email">
                이메일
              </label>
              <input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-xl border border-white/[0.08] bg-surface-900/60 px-4 py-3 text-sm text-surface-100 outline-none transition focus:border-brand-500/35 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            {error ? (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            ) : null}

            {message ? (
              <div className="rounded-xl border border-accent-500/20 bg-accent-500/10 px-4 py-3 text-sm text-accent-200">
                {message}
              </div>
            ) : null}

            <button type="submit" disabled={submitting} className="btn-primary w-full !py-4">
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  전송 중...
                </>
              ) : (
                <>
                  <Mail size={18} />
                  재설정 메일 보내기
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-surface-500">
            <Link href="/login" className="text-brand-400 hover:text-brand-300">
              로그인 화면으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
