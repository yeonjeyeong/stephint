'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  BookOpen,
  GraduationCap,
  Loader2,
  LogOut,
  Menu,
  UserPlus2,
  Users,
  X,
} from 'lucide-react';
import {
  canAccessTeacherFeatures,
  getDefaultRedirectForUser,
} from '@/lib/auth/access';
import { useRole } from '@/context/RoleContext';

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { role, user, logout, loading } = useRole();
  const homeHref = user ? getDefaultRedirectForUser(user) : '/';

  const studentLinks = [
    { href: '/student/upload', label: '풀이 올리기', id: 'nav-upload' },
    { href: '/student/history', label: '내 기록', id: 'nav-history' },
  ];
  const teacherLinks = canAccessTeacherFeatures(user)
    ? [{ href: '/teacher/dashboard', label: '교사용 보기', id: 'nav-dashboard' }]
    : [{ href: '/teacher/pending', label: '교사 승인 상태', id: 'nav-dashboard' }];
  const navLinks = role === 'teacher' ? teacherLinks : role === 'student' ? studentLinks : [];
  const roleLabel = role === 'student' ? '학생' : role === 'teacher' ? '교사' : null;
  const isAuthPage = ['/login', '/signup', '/forgot-password', '/reset-password'].includes(pathname);

  const handleLogout = async () => {
    await logout();
    setMobileOpen(false);
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[rgba(10,22,38,0.78)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        <Link href={homeHref} className="group flex items-center gap-3" id="logo-link">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(255,247,230,0.1)] text-[#f7d59d] shadow-[0_10px_24px_rgba(0,0,0,0.18)]">
            <BookOpen size={18} />
          </div>
          <div>
            <div className="text-xl tracking-tight text-white" style={{ fontFamily: 'var(--font-heading)' }}>
              StepHint
            </div>
            <div className="text-[11px] text-surface-400">공부가 막힐 때 곁에 두는 힌트 노트</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-3 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.id}
              href={link.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-surface-300 transition hover:bg-white/6 hover:text-white"
              id={link.id}
            >
              {link.label}
            </Link>
          ))}

          {user && roleLabel ? (
            <div className="ml-2 flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-3 py-2">
              <span className={`badge ${role === 'student' ? 'badge-accent' : 'badge-brand'}`}>
                {role === 'student' ? <GraduationCap size={12} className="mr-1" /> : <Users size={12} className="mr-1" />}
                {roleLabel}
              </span>
              <div className="text-right">
                <div className="text-sm font-semibold text-white">{user.displayName}</div>
                <div className="text-[11px] text-surface-400">{user.email}</div>
              </div>
              <button
                onClick={handleLogout}
                disabled={loading}
                className="rounded-full p-2 text-surface-400 transition hover:bg-white/8 hover:text-white disabled:opacity-50"
                id="btn-logout"
                aria-label="로그아웃"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
              </button>
            </div>
          ) : !isAuthPage ? (
            <div className="ml-2 flex items-center gap-2">
              <Link href="/login" className="btn-secondary text-sm !px-4 !py-2" id="nav-login">
                로그인
              </Link>
              <Link href="/signup" className="btn-primary text-sm !px-5 !py-2" id="nav-signup">
                <UserPlus2 size={14} />
                회원가입
              </Link>
            </div>
          ) : null}
        </nav>

        <button
          className="rounded-xl p-2 text-surface-300 transition hover:bg-white/6 md:hidden"
          onClick={() => setMobileOpen((open) => !open)}
          aria-label="메뉴 열기"
          id="mobile-menu-btn"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {mobileOpen ? (
        <div className="border-t border-white/10 bg-[rgba(10,22,38,0.95)] px-5 py-4 backdrop-blur-xl md:hidden">
          <nav className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.id}
                href={link.href}
                className="rounded-2xl px-4 py-3 text-sm font-medium text-surface-300 transition hover:bg-white/6 hover:text-white"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            {user && roleLabel ? (
              <div className="mt-2 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="mb-2 text-sm font-semibold text-white">{user.displayName}</div>
                <div className="mb-3 text-xs text-surface-400">
                  {roleLabel} 계정 · {user.email}
                </div>
                <button onClick={handleLogout} disabled={loading} className="btn-secondary w-full text-sm">
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
                  로그아웃
                </button>
              </div>
            ) : !isAuthPage ? (
              <div className="mt-2 grid gap-2">
                <Link href="/login" className="btn-secondary text-center text-sm" onClick={() => setMobileOpen(false)}>
                  로그인
                </Link>
                <Link href="/signup" className="btn-primary text-center text-sm" onClick={() => setMobileOpen(false)}>
                  회원가입
                </Link>
              </div>
            ) : null}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
