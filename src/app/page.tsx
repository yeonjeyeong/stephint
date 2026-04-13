'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  Lightbulb,
  NotebookPen,
  Sparkles,
  Users,
} from 'lucide-react';
import { getDefaultRedirectForUser } from '@/lib/auth/access';
import { useRole } from '@/context/RoleContext';

export default function LandingPage() {
  const { role, user } = useRole();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.prefetch(getDefaultRedirectForUser(user));
      return;
    }

    if (role === 'student') {
      router.prefetch('/student/upload');
    }
    if (role === 'teacher') {
      router.prefetch('/teacher/pending');
    }
  }, [role, router, user]);

  const handleRoleSelect = (selectedRole: 'student' | 'teacher') => {
    if (role === selectedRole && user) {
      router.push(getDefaultRedirectForUser(user));
      return;
    }

    router.push(`/login?role=${selectedRole}`);
  };

  return (
    <>
      <section className="gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.18) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
        }} />

        <div className="relative mx-auto max-w-6xl px-5 py-20 md:py-28">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-xs font-semibold text-[#ffe3b5]">
            <Sparkles size={13} />
            학생이 먼저 편한 학습 코치
            <ChevronRight size={12} />
          </div>

          <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <h1 className="mb-6 text-5xl leading-[1.08] tracking-tight text-white md:text-7xl">
                공부가 막힐 때,
                <br />
                <span className="text-gradient">정답 대신 다음 힌트를 건네는 친구</span>
              </h1>
              <p className="max-w-2xl text-lg leading-relaxed text-surface-300 md:text-xl">
                StepHint는 학생의 풀이 과정을 읽고 어디서 멈췄는지 먼저 짚어줍니다.
                바로 답을 주기보다, 스스로 이어서 풀 수 있는 다음 한 걸음을 코칭합니다.
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <button onClick={() => handleRoleSelect('student')} className="btn-primary text-base">
                  <GraduationCap size={18} />
                  학생으로 시작하기
                </button>
                <button onClick={() => handleRoleSelect('teacher')} className="btn-secondary text-base">
                  <Users size={18} />
                  교사 화면 보기
                </button>
              </div>

              <div className="mt-10 flex flex-wrap gap-3">
                {[
                  '풀이 이미지 바로 업로드',
                  '정답 노출 없는 힌트',
                  '반복 오개념 대시보드',
                ].map((item) => (
                  <span key={item} className="badge badge-brand text-xs">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="glass-card p-6 md:p-7">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(255,236,207,0.1)] text-[#ffd59d]">
                  <NotebookPen size={22} />
                </div>
                <div>
                  <div className="text-lg text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                    오늘의 학습 흐름
                  </div>
                  <div className="text-sm text-surface-400">문제 업로드부터 교사 인사이트까지 한 번에</div>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  {
                    icon: <BookOpen size={18} />,
                    title: '문제와 풀이를 올립니다',
                    desc: '사진 그대로 올리면 OCR과 AI가 풀이 흐름을 읽습니다.',
                  },
                  {
                    icon: <Brain size={18} />,
                    title: '막힌 지점을 먼저 진단합니다',
                    desc: '잘한 부분과 막힌 부분을 같이 보여줘서 자신감을 잃지 않게 돕습니다.',
                  },
                  {
                    icon: <Lightbulb size={18} />,
                    title: '다음 한 단계 힌트를 줍니다',
                    desc: '정답 대신 다음 줄을 스스로 써 볼 수 있는 방향만 제안합니다.',
                  },
                ].map((item) => (
                  <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="mb-2 flex items-center gap-2 text-white">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[rgba(121,201,170,0.12)] text-accent-300">
                        {item.icon}
                      </span>
                      <span className="font-semibold">{item.title}</span>
                    </div>
                    <p className="text-sm leading-relaxed text-surface-400">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="gradient-page py-24">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mb-14 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-xs font-semibold text-[#ffe3b5]">
              <CheckCircle2 size={13} />
              학생 친화적인 이유
            </div>
            <h2 className="mb-4 text-3xl text-white md:text-5xl">답보다 먼저, 마음을 덜 막히게</h2>
            <p className="mx-auto max-w-2xl text-lg text-surface-400">
              StepHint는 “틀렸어”보다 “여기서 한 번만 더 생각해 보자”에 가까운 톤으로 설계했습니다.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                title: '혼자 공부해도 덜 막히게',
                desc: '모르는 순간을 바로 기록하고, 내가 어느 단계에서 헷갈렸는지 다시 볼 수 있습니다.',
                icon: <NotebookPen size={22} />,
              },
              {
                title: '힌트는 짧고 부담 없게',
                desc: '전체 풀이를 던져주지 않고, 바로 다음 줄만 이어 쓸 수 있게 도와줍니다.',
                icon: <Lightbulb size={22} />,
              },
              {
                title: '교사도 빠르게 파악하게',
                desc: '반복되는 오개념과 개입이 필요한 학생을 따로 모아 보여줍니다.',
                icon: <Users size={22} />,
              },
            ].map((item) => (
              <div key={item.title} className="glass-card p-7">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(255,236,207,0.1)] text-[#ffd59d]">
                  {item.icon}
                </div>
                <h3 className="mb-3 text-2xl text-white">{item.title}</h3>
                <p className="text-sm leading-relaxed text-surface-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
