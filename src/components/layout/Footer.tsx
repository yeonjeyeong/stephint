'use client';

import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { canAccessTeacherFeatures } from '@/lib/auth/access';
import { useRole } from '@/context/RoleContext';

export function Footer() {
  const { role, user } = useRole();

  const quickLinks =
    role === 'teacher'
      ? [
          {
            href: canAccessTeacherFeatures(user) ? '/teacher/dashboard' : '/teacher/pending',
            label: canAccessTeacherFeatures(user) ? '교사 대시보드' : '교사 승인 상태',
          },
        ]
      : role === 'student'
        ? [
            { href: '/student/upload', label: '풀이 올리기' },
            { href: '/student/history', label: '내 기록 보기' },
          ]
        : [
            { href: '/login?role=student', label: '학생으로 시작' },
            { href: '/login?role=teacher', label: '교사로 시작' },
          ];

  const featureLinks = [
    { href: '/features/misconception', label: '오개념 진단' },
    { href: '/features/hint', label: '다음 한 단계 힌트' },
    { href: '/features/insight', label: '교사용 집단 인사이트' },
  ];

  return (
    <footer className="border-t border-white/8 bg-[rgba(8,18,31,0.96)]">
      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[rgba(255,247,230,0.1)] text-[#f7d59d]">
                <BookOpen size={16} />
              </div>
              <div>
                <div className="text-lg text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                  StepHint
                </div>
                <div className="text-xs text-surface-400">정답 대신 다음 한 줄을 건네는 풀이형 학습 코치</div>
              </div>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-surface-400">
              학생이 풀이를 올리면 막힌 지점을 먼저 읽고, 교사는 누적된 패턴을 바탕으로 더 빠르게 개입할 수 있게 돕습니다.
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-surface-200">바로가기</h4>
            <ul className="space-y-2.5 text-sm text-surface-400">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-surface-200">살펴보기</h4>
            <ul className="space-y-2.5 text-sm text-surface-400">
              {featureLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="divider-glow mb-6 mt-10" />

        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-xs text-surface-500">© 2026 StepHint. Built for student-friendly learning.</p>
          <p className="text-xs text-surface-500">AI 활용 차세대 교육 솔루션 공모전 제출 버전</p>
        </div>
      </div>
    </footer>
  );
}
