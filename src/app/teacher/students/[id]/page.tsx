'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Loader2,
  ShieldCheck,
  Tag,
  Target,
} from 'lucide-react';
import type { StudentDashboard } from '@/types/submission';

function formatDate(dateStr: string | null) {
  if (!dateStr) {
    return '기록 없음';
  }

  return new Date(dateStr).toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function TeacherStudentDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const [data, setData] = useState<StudentDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStudentDashboard() {
      try {
        const response = await fetch(`/api/teacher/students/${resolvedParams.id}/dashboard`, {
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error();
        }

        const json = (await response.json()) as StudentDashboard;
        setData(json);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    fetchStudentDashboard();
  }, [resolvedParams.id]);

  if (loading) {
    return (
      <div className="gradient-page flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 size={40} className="mx-auto mb-4 animate-spin text-brand-400" />
          <p className="font-medium text-surface-400">학생 대시보드를 불러오고 있습니다...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="gradient-page flex min-h-screen items-center justify-center">
        <div className="glass-card max-w-md p-10 text-center">
          <h2 className="mb-3 text-xl font-bold text-white">학생 정보를 찾을 수 없습니다</h2>
          <Link href="/teacher/dashboard" className="btn-primary">
            교사 대시보드로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="gradient-page min-h-screen">
      <div className="mx-auto max-w-6xl px-5 py-12 md:py-16">
        <Link href="/teacher/dashboard" className="mb-8 inline-flex items-center gap-2 text-sm text-surface-500 transition hover:text-brand-400">
          <ArrowLeft size={16} />
          교사 대시보드로 돌아가기
        </Link>

        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-500/15 bg-brand-500/10 px-4 py-1.5 text-xs font-semibold text-brand-400">
              <Target size={13} />
              학생별 사고 분석
            </div>
            <h1 className="text-3xl font-bold md:text-5xl">{data.student.displayName}</h1>
            <p className="mt-2 text-lg text-surface-400">
              {data.student.email} · 닉네임 {data.student.username}
            </p>
          </div>

          <div className="rounded-3xl border border-white/[0.06] bg-white/[0.03] px-5 py-4 text-sm text-surface-400">
            연결일
            <div className="mt-1 font-semibold text-surface-200">{formatDate(data.linkedAt)}</div>
          </div>
        </div>

        <div className="mb-6 rounded-3xl border border-brand-500/15 bg-brand-500/8 p-6">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-brand-300">
            <ShieldCheck size={16} />
            교사 추천 액션
          </div>
          <p className="text-base leading-relaxed text-surface-200">{data.teacherRecommendation}</p>
        </div>

        <div className="mb-10 grid gap-4 md:grid-cols-3">
          {[
            { label: '전체 제출', value: data.totalSubmissions, tone: 'brand' },
            { label: '완료된 진단', value: data.completedSubmissions, tone: 'accent' },
            { label: '최근 제출', value: formatDate(data.lastSubmissionAt), tone: 'warm' },
          ].map((item) => (
            <div key={item.label} className="glass-card p-5">
              <div className="text-sm text-surface-500">{item.label}</div>
              <div
                className={`mt-2 ${item.label === '최근 제출' ? 'text-lg' : 'text-3xl'} font-bold ${
                  item.tone === 'accent'
                    ? 'text-accent-400'
                    : item.tone === 'warm'
                      ? 'text-warm-400'
                      : 'text-brand-400'
                }`}
              >
                {item.value}
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="space-y-5">
            <div className="glass-card p-7">
              <div className="mb-5 flex items-center gap-2">
                <Tag size={16} className="text-warm-400" />
                <h2 className="text-xl font-bold text-white">반복 오개념</h2>
              </div>
              <div className="space-y-3">
                {data.topMisconceptions.length > 0 ? (
                  data.topMisconceptions.map((item, index) => (
                    <div key={item.tag} className="flex items-center gap-3">
                      <div className="w-7 text-right text-sm font-bold text-surface-600">#{index + 1}</div>
                      <div className="flex-1 rounded-2xl border border-white/[0.05] bg-surface-900/55 px-4 py-3 font-medium text-surface-200">
                        {item.tag}
                      </div>
                      <div className="text-sm font-semibold text-warm-400">{item.count}</div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-surface-500">완료된 진단이 생기면 반복 오개념이 나타납니다.</p>
                )}
              </div>
            </div>

            <div className="glass-card p-7">
              <div className="mb-5 flex items-center gap-2">
                <BookOpen size={16} className="text-accent-400" />
                <h2 className="text-xl font-bold text-white">복습 추천 개념</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {data.reviewConcepts.length > 0 ? (
                  data.reviewConcepts.map((concept) => (
                    <span key={concept.concept} className="badge badge-brand">
                      {concept.concept} · {concept.count}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-surface-500">복습 개념 데이터가 아직 없습니다.</p>
                )}
              </div>
            </div>

            <div className="glass-card p-7">
              <div className="mb-5 flex items-center gap-2">
                <Target size={16} className="text-brand-400" />
                <h2 className="text-xl font-bold text-white">문제 유형 분포</h2>
              </div>
              <div className="space-y-3">
                {data.problemTypeDistribution.length > 0 ? (
                  data.problemTypeDistribution.map((item) => (
                    <div key={item.type} className="flex items-center gap-3">
                      <div className="flex-1 rounded-2xl border border-white/[0.05] bg-surface-900/55 px-4 py-3 font-medium text-surface-200">
                        {item.type}
                      </div>
                      <div className="text-sm font-semibold text-brand-400">{item.count}</div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-surface-500">문제 유형 분포가 아직 없습니다.</p>
                )}
              </div>
            </div>
          </section>

          <section className="glass-card p-7">
            <div className="mb-5 flex items-center gap-2">
              <Clock size={16} className="text-brand-400" />
              <h2 className="text-xl font-bold text-white">최근 진단 기록</h2>
            </div>
            <div className="space-y-4">
              {data.recentSubmissions.length > 0 ? (
                data.recentSubmissions.map((submission) => (
                  <div key={submission.id} className="rounded-3xl border border-white/[0.06] bg-white/[0.03] p-5">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <div className="text-lg font-bold text-white">
                          {submission.diagnosis?.problemType || '분석 결과 대기'}
                        </div>
                        <div className="mt-1 text-xs text-surface-500">{formatDate(submission.createdAt)}</div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="badge badge-brand text-xs">{submission.providerName || 'provider 없음'}</span>
                        {submission.fallbackUsed ? <span className="badge badge-warm text-xs">fallback</span> : null}
                      </div>
                    </div>

                    {submission.problemImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={submission.problemImageUrl} alt="문제 이미지" className="mb-3 h-40 w-full rounded-2xl object-cover" />
                    ) : null}

                    {submission.solutionImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={submission.solutionImageUrl} alt="풀이 이미지" className="mb-3 h-40 w-full rounded-2xl object-cover" />
                    ) : null}

                    {submission.diagnosis ? (
                      <>
                        <div className="mb-3 text-sm leading-relaxed text-surface-400">
                          <span className="font-semibold text-surface-200">막힌 지점:</span>{' '}
                          {submission.diagnosis.stuckPoint}
                        </div>
                        <div className="mb-3 flex flex-wrap gap-2">
                          {submission.diagnosis.misconceptionTags.map((tag) => (
                            <span key={tag} className="badge badge-warm">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div className="rounded-2xl border border-brand-500/15 bg-brand-500/8 p-4">
                          <div className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-300">
                            다음 힌트
                          </div>
                          <div className="text-sm leading-relaxed text-surface-200">
                            {submission.diagnosis.nextHint}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="rounded-2xl border border-white/[0.06] bg-surface-900/40 p-4 text-sm text-surface-500">
                        아직 진단이 완료되지 않았습니다.
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-white/[0.06] bg-white/[0.03] p-8 text-center text-surface-500">
                  아직 완료된 진단 기록이 없습니다.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
