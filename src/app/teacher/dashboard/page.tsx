'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  Link2,
  Loader2,
  ShieldCheck,
  Tag,
  UserCheck,
  Users,
} from 'lucide-react';
import { ZoomableSubmissionImage } from '@/components/submission/ZoomableSubmissionImage';
import type { DashboardSummary } from '@/types/submission';

function formatDate(dateStr: string | null) {
  if (!dateStr) {
    return '기록 없음';
  }

  return new Date(dateStr).toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function TeacherDashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(false);
  const [approvingTeacherId, setApprovingTeacherId] = useState<string | null>(null);
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function fetchDashboard() {
    setLoading(true);

    try {
      const response = await fetch('/api/dashboard/summary', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error();
      }

      const json = (await response.json()) as DashboardSummary;
      setData(json);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleLinkStudent = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLinking(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/teacher/students/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || '학생 연결에 실패했습니다.');
      }

      setIdentifier('');
      setSuccessMessage('학생 연결을 완료했습니다.');
      await fetchDashboard();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : '학생 연결 중 문제가 발생했습니다.'
      );
    } finally {
      setLinking(false);
    }
  };

  const handleApproveTeacher = async (teacherId: string) => {
    setApprovingTeacherId(teacherId);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/teacher/approvals/${teacherId}`, {
        method: 'POST',
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || '교사 계정 승인에 실패했습니다.');
      }

      setSuccessMessage('교사 계정을 승인했습니다.');
      await fetchDashboard();
    } catch (approveError) {
      setError(
        approveError instanceof Error
          ? approveError.message
          : '교사 계정 승인 중 문제가 발생했습니다.'
      );
    } finally {
      setApprovingTeacherId(null);
    }
  };

  if (loading) {
    return (
      <div className="gradient-page flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 size={40} className="mx-auto mb-4 animate-spin text-brand-400" />
          <p className="font-medium text-surface-400">교사 대시보드를 불러오는 중입니다...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="gradient-page flex min-h-screen items-center justify-center">
        <div className="glass-card max-w-md p-10 text-center">
          <h2 className="mb-3 text-xl font-bold text-white">대시보드를 불러오지 못했습니다</h2>
          <p className="text-sm text-surface-400">잠시 후 새로고침해서 다시 확인해 주세요.</p>
        </div>
      </div>
    );
  }

  const activeStudents = data.studentInsights.filter((student) => student.submissionCount > 0).length;

  return (
    <div className="gradient-page min-h-screen">
      <div className="mx-auto max-w-6xl px-5 py-12 md:py-16">
        <div className="mb-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-500/15 bg-brand-500/10 px-4 py-1.5 text-xs font-semibold text-brand-400">
            <Users size={13} />
            교사 분석 대시보드
          </div>
          <h1 className="mb-3 text-3xl font-bold md:text-5xl">
            학생별 흐름과 반복 오개념을
            <br className="hidden md:block" />한눈에 살펴보세요
          </h1>
          <p className="max-w-3xl text-lg text-surface-400">
            연결한 학생의 최근 제출, 반복되는 오개념, 바로 개입이 필요한 학생을 한 화면에서
            확인할 수 있습니다.
          </p>
        </div>

        <div className="mb-10 grid gap-4 md:grid-cols-4">
          {[
            { label: '연결 학생', value: data.studentInsights.length, tone: 'brand' },
            { label: '활동 학생', value: activeStudents, tone: 'accent' },
            { label: '최근 제출', value: data.recentSubmissions.length, tone: 'warm' },
            { label: '개입 필요', value: data.attentionStudents.length, tone: 'brand' },
          ].map((item) => (
            <div key={item.label} className="glass-card p-5">
              <div className="text-sm text-surface-500">{item.label}</div>
              <div
                className={`mt-2 text-3xl font-bold ${
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

        <div className="mb-6 rounded-3xl border border-brand-500/15 bg-brand-500/8 p-6">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-brand-300">
            <ShieldCheck size={16} />
            오늘의 교사 요약
          </div>
          <p className="text-base leading-relaxed text-surface-200">{data.teacherSummary}</p>
        </div>

        {data.isTeacherAdmin ? (
          <section className="mb-6 glass-card p-7">
            <div className="mb-4 flex items-center gap-2">
              <UserCheck size={16} className="text-accent-400" />
              <h2 className="text-xl font-bold text-white">승인 대기 교사 계정</h2>
            </div>
            <p className="mb-4 text-sm text-surface-500">
              관리자 교사는 기존 화면을 그대로 사용하면서, 교사 승인 기능만 추가로 노출합니다.
            </p>

            {data.pendingTeacherApprovals.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {data.pendingTeacherApprovals.map((teacher) => (
                  <div
                    key={teacher.id}
                    className="rounded-3xl border border-white/[0.06] bg-white/[0.03] p-5"
                  >
                    <div className="mb-3">
                      <div className="text-lg font-bold text-white">{teacher.displayName}</div>
                      <div className="text-sm text-surface-500">{teacher.username}</div>
                      <div className="text-xs text-surface-600">{teacher.email}</div>
                    </div>
                    <div className="mb-4 text-xs text-surface-500">
                      가입 시각: {formatDate(teacher.createdAt)}
                    </div>
                    <button
                      onClick={() => handleApproveTeacher(teacher.id)}
                      disabled={approvingTeacherId === teacher.id}
                      className="btn-primary w-full"
                    >
                      {approvingTeacherId === teacher.id ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          승인 중...
                        </>
                      ) : (
                        <>
                          <UserCheck size={16} />
                          교사 권한 승인
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 text-sm text-surface-500">
                현재 승인 대기 중인 교사 계정이 없습니다.
              </div>
            )}
          </section>
        ) : null}

        <div className="mb-5 grid gap-5 lg:grid-cols-[1fr_1fr]">
          <section className="glass-card p-7">
            <div className="mb-4 flex items-center gap-2">
              <Link2 size={16} className="text-brand-400" />
              <h2 className="text-xl font-bold text-white">학생 연결 추가</h2>
            </div>
            <p className="mb-4 text-sm text-surface-500">
              전체 학생 목록은 보이지 않습니다. 학생의 이메일 주소 또는 닉네임을 입력해 연결하세요.
            </p>

            <form className="space-y-3" onSubmit={handleLinkStudent}>
              <input
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder="이메일 주소 또는 닉네임을 입력하세요"
                className="w-full rounded-xl border border-white/[0.08] bg-surface-900/60 px-4 py-3 text-sm text-surface-100 outline-none transition focus:border-brand-500/35 focus:ring-2 focus:ring-brand-500/20"
              />
              <button type="submit" disabled={linking} className="btn-primary w-full">
                {linking ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    연결 중...
                  </>
                ) : (
                  <>
                    <Link2 size={16} />
                    학생 연결하기
                  </>
                )}
              </button>
            </form>

            {error ? (
              <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            ) : null}

            {successMessage ? (
              <div className="mt-4 rounded-xl border border-accent-500/20 bg-accent-500/10 px-4 py-3 text-sm text-accent-200">
                {successMessage}
              </div>
            ) : null}
          </section>

          <section className="glass-card p-7">
            <div className="mb-4 flex items-center gap-2">
              <AlertTriangle size={16} className="text-warm-400" />
              <h2 className="text-xl font-bold text-white">개입이 필요한 학생</h2>
            </div>
            <div className="space-y-3">
              {data.attentionStudents.length > 0 ? (
                data.studentInsights
                  .filter((student) => student.needsAttention)
                  .map((student) => (
                    <Link
                      key={student.studentId}
                      href={`/teacher/students/${student.studentId}`}
                      className="block rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 transition hover:border-warm-500/30"
                    >
                      <div className="mb-1 font-semibold text-white">{student.studentName}</div>
                      <div className="mb-2 text-xs text-surface-500">
                        닉네임 {student.studentUsername}
                      </div>
                      <div className="text-sm leading-relaxed text-surface-400">
                        {student.attentionReason}
                      </div>
                    </Link>
                  ))
              ) : (
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 text-sm text-surface-500">
                  현재 바로 개입이 필요한 학생은 없습니다.
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="glass-card p-7">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white">학생 카드</h2>
              <p className="mt-1 text-sm text-surface-500">
                학생별 최근 흐름과 반복 오개념을 빠르게 확인해 보세요.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {data.studentInsights.map((student) => (
                <Link
                  key={student.studentId}
                  href={`/teacher/students/${student.studentId}`}
                  className="group rounded-3xl border border-white/[0.06] bg-white/[0.03] p-5 transition hover:border-brand-500/25 hover:bg-brand-500/5"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <div className="text-lg font-bold text-white">{student.studentName}</div>
                      <div className="text-sm text-surface-500">닉네임 {student.studentUsername}</div>
                    </div>
                    <div className="rounded-xl border border-brand-500/15 bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-300">
                      제출 {student.submissionCount}건
                    </div>
                  </div>

                  <div className="mb-4 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-white/[0.05] bg-surface-900/50 p-3">
                      <div className="text-xs text-surface-500">최근 제출</div>
                      <div className="mt-1 text-sm font-semibold text-surface-200">
                        {formatDate(student.lastSubmissionAt)}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/[0.05] bg-surface-900/50 p-3">
                      <div className="text-xs text-surface-500">최근 유형</div>
                      <div className="mt-1 text-sm font-semibold text-surface-200">
                        {student.latestProblemType || '없음'}
                      </div>
                    </div>
                  </div>

                  <div className="mb-4 flex flex-wrap gap-2">
                    {student.topMisconceptions.length > 0 ? (
                      student.topMisconceptions.map((tag) => (
                        <span key={tag.tag} className="badge badge-warm">
                          {tag.tag} · {tag.count}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-surface-600">아직 분석 데이터가 충분하지 않습니다.</span>
                    )}
                  </div>

                  <div className="text-sm leading-relaxed text-surface-400">
                    {student.attentionReason ||
                      student.latestStuckPoint ||
                      '최근 진단이 쌓이면 막힌 지점이 이곳에 표시됩니다.'}
                  </div>

                  <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-400">
                    학생 대시보드 보기
                    <ArrowRight size={15} className="transition group-hover:translate-x-0.5" />
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="space-y-5">
            <div className="glass-card p-7">
              <div className="mb-5 flex items-center gap-2">
                <Tag size={16} className="text-warm-400" />
                <h2 className="text-xl font-bold text-white">전체 오개념 상위</h2>
              </div>
              <div className="space-y-3">
                {data.topMisconceptions.length > 0 ? (
                  data.topMisconceptions.slice(0, 5).map((item, index) => (
                    <div key={item.tag} className="flex items-center gap-3">
                      <div className="w-7 text-right text-sm font-bold text-surface-600">
                        #{index + 1}
                      </div>
                      <div className="flex-1 rounded-2xl border border-white/[0.05] bg-surface-900/55 px-4 py-3 font-medium text-surface-200">
                        {item.tag}
                      </div>
                      <div className="text-sm font-semibold text-warm-400">{item.count}</div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 text-sm text-surface-500">
                    아직 집계할 오개념 데이터가 없습니다.
                  </div>
                )}
              </div>
            </div>

            <div className="glass-card p-7">
              <div className="mb-5 flex items-center gap-2">
                <Clock size={16} className="text-brand-400" />
                <h2 className="text-xl font-bold text-white">최근 제출</h2>
              </div>
              <div className="space-y-3">
                {data.recentSubmissions.length > 0 ? (
                  data.recentSubmissions.slice(0, 4).map((submission) => (
                    <div
                      key={submission.id}
                      className="rounded-3xl border border-white/[0.06] bg-white/[0.03] p-4"
                    >
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold text-white">
                            {submission.diagnosis?.problemType || '분석 대기 중'}
                          </div>
                          <div className="mt-1 text-xs text-surface-500">
                            {formatDate(submission.createdAt)}
                          </div>
                          {submission.studentName ? (
                            <div className="mt-1 text-xs text-surface-400">
                              {submission.studentName}
                              {submission.studentUsername ? ` · ${submission.studentUsername}` : ''}
                            </div>
                          ) : null}
                        </div>
                        <span className="badge badge-brand text-xs">
                          {submission.providerName || 'provider 없음'}
                        </span>
                      </div>

                      {submission.problemImageUrl || submission.solutionImageUrl ? (
                        <div
                          className={`mb-3 grid gap-3 ${
                            submission.problemImageUrl && submission.solutionImageUrl
                              ? 'sm:grid-cols-2'
                              : ''
                          }`}
                        >
                          {submission.problemImageUrl ? (
                            <ZoomableSubmissionImage
                              src={submission.problemImageUrl}
                              alt="문제 이미지"
                              label="문제 이미지"
                              frameClassName="h-32"
                            />
                          ) : null}
                          {submission.solutionImageUrl ? (
                            <ZoomableSubmissionImage
                              src={submission.solutionImageUrl}
                              alt="풀이 이미지"
                              label="풀이 이미지"
                              frameClassName="h-32"
                            />
                          ) : null}
                        </div>
                      ) : null}

                      <p className="text-sm leading-relaxed text-surface-400">
                        {submission.diagnosis?.stuckPoint ||
                          '진단이 완료되면 막힌 지점이 여기에 표시됩니다.'}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-3xl border border-white/[0.06] bg-white/[0.03] p-8 text-center text-surface-500">
                    아직 제출 기록이 없습니다.
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
