'use client';

import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { getDefaultRedirectForUser } from '@/lib/auth/access';
import { useRole } from '@/context/RoleContext';

const COPY = {
  title: '\uc798\ubabb\ub41c \uc811\uadfc\uc785\ub2c8\ub2e4',
  teacherOnly: '\uad50\uc0ac \uc804\uc6a9 \ud398\uc774\uc9c0\uc785\ub2c8\ub2e4.',
  studentOnly: '\ud559\uc0dd \uc804\uc6a9 \ud398\uc774\uc9c0\uc785\ub2c8\ub2e4.',
  teacherBack: '\uad50\uc0ac \ub300\uc2dc\ubcf4\ub4dc\ub85c \ub3cc\uc544\uac00\uae30',
  studentBack: '\ud559\uc0dd \ud398\uc774\uc9c0\ub85c \ub3cc\uc544\uac00\uae30',
  homeBack: '\ud648\uc73c\ub85c \ub3cc\uc544\uac00\uae30',
  pendingBack: '\uad50\uc0ac \uc2b9\uc778 \uc0c1\ud0dc\ub85c \ub3cc\uc544\uac00\uae30',
} as const;

export default function AccessDeniedPage() {
  const searchParams = useSearchParams();
  const { user } = useRole();
  const required = searchParams.get('required');

  const description =
    required === 'teacher'
      ? COPY.teacherOnly
      : required === 'student'
        ? COPY.studentOnly
        : '\ud604\uc7ac \uacc4\uc815\uc73c\ub85c\ub294 \uc774 \ud398\uc774\uc9c0\uc5d0 \uc811\uadfc\ud560 \uc218 \uc5c6\uc2b5\ub2c8\ub2e4.';

  const redirectPath = user ? getDefaultRedirectForUser(user) : '/';
  const buttonLabel = user
    ? user.role === 'teacher'
      ? user.teacherApproved || user.isTeacherAdmin
        ? COPY.teacherBack
        : COPY.pendingBack
      : COPY.studentBack
    : COPY.homeBack;

  return (
    <div className="gradient-page flex min-h-screen items-center justify-center px-5 py-16">
      <div className="glass-card max-w-xl p-8 text-center md:p-10">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-red-400/20 bg-red-400/10 px-4 py-1.5 text-xs font-semibold text-red-200">
          <ShieldAlert size={13} />
          {COPY.title}
        </div>

        <h1 className="mb-3 text-3xl font-bold text-white">{COPY.title}</h1>
        <p className="mb-6 text-sm leading-relaxed text-surface-400 md:text-base">
          {description}
        </p>

        <Link href={redirectPath} className="btn-primary">
          {buttonLabel}
        </Link>
      </div>
    </div>
  );
}
