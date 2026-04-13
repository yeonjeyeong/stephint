'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Clock, FileText, Inbox, Loader2, ShieldCheck, Tag, Target } from 'lucide-react';
import type { SubmissionWithDiagnosis } from '@/types/submission';
import { RoleGuard } from '@/components/auth/RoleGuard';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function HistoryPage() {
  const [submissions, setSubmissions] = useState<SubmissionWithDiagnosis[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    async function fetchHistory() {
      try {
        const response = await fetch('/api/history', { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          setSubmissions(data.submissions || []);
        }
      } catch {
        setSubmissions([]);
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, []);

  const problemTypes = [
    'all',
    ...new Set(
      submissions.map((submission) => submission.diagnosis?.problemType).filter(Boolean) as string[]
    ),
  ];

  const filtered =
    filter === 'all'
      ? submissions
      : submissions.filter((submission) => submission.diagnosis?.problemType === filter);

  if (loading) {
    return (
      <div className="gradient-page flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 size={40} className="mx-auto mb-4 animate-spin text-brand-400" />
          <p className="font-medium text-surface-400">학습 이력을 불러오고 있습니다...</p>
        </div>
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={['student']}>
      <div className="gradient-page min-h-screen">
        <div className="mx-auto max-w-5xl px-5 py-12 md:py-16">
        <div className="mb-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-500/15 bg-brand-500/10 px-4 py-1.5 text-xs font-semibold text-brand-400">
            <Clock size={13} />
            학습 이력
          </div>
          <h1 className="mb-3 text-3xl font-bold md:text-5xl">나의 풀이 진단 기록</h1>
          <p className="text-lg text-surface-400">이전 진단 결과를 다시 보며, 반복되는 오개념과 힌트 흐름을 복습할 수 있습니다.</p>
        </div>

        {problemTypes.length > 1 ? (
          <div className="mb-8 flex flex-wrap gap-2">
            {problemTypes.map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                  filter === type
                    ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/25'
                    : 'border border-white/[0.06] bg-surface-800/50 text-surface-400 hover:border-brand-500/30 hover:text-surface-300'
                }`}
              >
                {type === 'all' ? '전체' : type}
              </button>
            ))}
          </div>
        ) : null}

        {filtered.length === 0 ? (
          <div className="glass-card p-14 text-center">
            <Inbox size={48} className="mx-auto mb-4 text-surface-700" />
            <h3 className="mb-3 text-lg font-bold text-surface-300">아직 진단 기록이 없습니다</h3>
            <p className="mb-8 text-surface-500">첫 문제를 업로드하면 풀이 진단 기록이 쌓이기 시작합니다.</p>
            <Link href="/student/upload" className="btn-primary">
              첫 풀이 분석하기
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((submission) => (
              <Link key={submission.id} href={`/student/result/${submission.id}`} className="group block result-card">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2.5 flex flex-wrap items-center gap-2.5">
                      <span className="inline-flex items-center gap-1.5 font-bold text-white">
                        <Target size={16} className="text-brand-400" />
                        {submission.diagnosis?.problemType || '진단 준비 중'}
                      </span>
                      <span
                        className={`badge text-xs ${
                          submission.status === 'completed'
                            ? 'badge-accent'
                            : submission.status === 'failed'
                              ? 'badge-warm'
                              : 'badge-brand'
                        }`}
                      >
                        {submission.status === 'completed'
                          ? '완료'
                          : submission.status === 'failed'
                            ? '실패'
                            : '대기'}
                      </span>
                      <span className="badge badge-brand text-xs">
                        <ShieldCheck size={10} className="mr-1" />
                        {submission.providerName || 'provider 없음'}
                      </span>
                      {submission.fallbackUsed ? <span className="badge badge-warm text-xs">fallback 사용</span> : null}
                    </div>

                    {submission.diagnosis ? (
                      <>
                        <p className="mb-2.5 line-clamp-2 text-sm text-surface-400">
                          {submission.diagnosis.stuckPoint}
                        </p>
                        <div className="mb-2.5 flex flex-wrap gap-1.5">
                          {submission.diagnosis.misconceptionTags.map((tag) => (
                            <span key={tag} className="badge badge-warm text-xs !px-2 !py-0.5">
                              <Tag size={10} className="mr-1" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      </>
                    ) : null}

                    <div className="flex flex-wrap items-center gap-3 text-xs text-surface-600">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {formatDate(submission.createdAt)}
                      </span>
                      {submission.studentNote ? (
                        <span className="flex items-center gap-1">
                          <FileText size={12} />
                          메모 있음
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <ChevronRight size={20} className="mt-1 flex-shrink-0 text-surface-700 transition-colors group-hover:text-brand-400" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
    </RoleGuard>
  );
}
