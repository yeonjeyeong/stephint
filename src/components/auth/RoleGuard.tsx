'use client';

import Link from 'next/link';
import { Loader2, ShieldAlert } from 'lucide-react';
import { useRole } from '@/context/RoleContext';
import type { AppRole } from '@/lib/auth/types';

interface RoleGuardProps {
  allowedRoles: AppRole[];
  children: React.ReactNode;
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { role, loading } = useRole();

  if (loading) {
    return (
      <div className="gradient-page flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 size={40} className="mx-auto mb-4 animate-spin text-brand-400" />
          <p className="font-medium text-surface-400">권한을 확인하고 있습니다...</p>
        </div>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="gradient-page flex min-h-screen items-center justify-center">
        <div className="glass-card max-w-md p-10 text-center glow-brand">
          <ShieldAlert size={40} className="mx-auto mb-4 text-warm-400" />
          <h2 className="mb-3 text-xl font-bold text-white">로그인이 필요합니다</h2>
          <p className="mb-6 text-sm text-surface-400">
            이 페이지는 로그인한 사용자만 사용할 수 있습니다.
          </p>
          <Link href="/login" className="btn-primary">
            로그인하러 가기
          </Link>
        </div>
      </div>
    );
  }

  if (!allowedRoles.includes(role)) {
    const redirectPath = role === 'teacher' ? '/teacher/dashboard' : '/student/upload';

    return (
      <div className="gradient-page flex min-h-screen items-center justify-center">
        <div className="glass-card max-w-md p-10 text-center glow-brand">
          <ShieldAlert size={40} className="mx-auto mb-4 text-danger-500" />
          <h2 className="mb-3 text-xl font-bold text-white">접근 권한이 없습니다</h2>
          <p className="mb-6 text-sm text-surface-400">
            현재 로그인한 계정 역할로는 이 화면에 접근할 수 없습니다.
          </p>
          <Link href={redirectPath} className="btn-primary">
            이동 가능한 화면으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
