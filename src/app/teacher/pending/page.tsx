'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, ShieldCheck } from 'lucide-react';
import { useRole } from '@/context/RoleContext';

export default function TeacherPendingPage() {
  const { refresh, loading } = useRole();
  const [checking, setChecking] = useState(false);

  const handleRefresh = async () => {
    setChecking(true);
    try {
      await refresh();
      window.location.reload();
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="gradient-page flex min-h-screen items-center justify-center px-5 py-16">
      <div className="glass-card max-w-xl p-8 text-center md:p-10">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-500/15 bg-brand-500/10 px-4 py-1.5 text-xs font-semibold text-brand-400">
          <ShieldCheck size={13} />
          교사 계정 승인 대기
        </div>

        <h1 className="mb-3 text-3xl font-bold text-white">교사 계정 승인을 기다리고 있습니다</h1>
        <p className="mb-6 text-sm leading-relaxed text-surface-400 md:text-base">
          관리자 교사가 이 계정을 활성화하면 교사 대시보드와 학생 연결 기능을 사용할 수 있습니다.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <button onClick={handleRefresh} disabled={checking || loading} className="btn-primary">
            {checking || loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                승인 상태 확인 중...
              </>
            ) : (
              <>승인 상태 다시 확인</>
            )}
          </button>
          <Link href="/" className="btn-secondary text-center">
            홈으로 가기
          </Link>
        </div>
      </div>
    </div>
  );
}
