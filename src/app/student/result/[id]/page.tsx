'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  HelpCircle,
  Lightbulb,
  Loader2,
  ScanText,
  ShieldCheck,
  Sparkles,
  Tag,
  Target,
} from 'lucide-react';
import type { Diagnosis } from '@/types/diagnosis';
import { RoleGuard } from '@/components/auth/RoleGuard';

interface ResultData {
  submissionId: string;
  diagnosis: Diagnosis | null;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
  studentNote: string | null;
  problemImageUrl: string | null;
  solutionImageUrl: string | null;
  problemOcrText?: string | null;
  solutionOcrText?: string | null;
  providerName?: string | null;
  promptVersion?: string | null;
  fallbackUsed?: boolean;
  leakageGuardPassed?: boolean;
}

function InfoCard({
  title,
  children,
  icon,
  tone = 'brand',
}: {
  title: string;
  children: React.ReactNode;
  icon: React.ReactNode;
  tone?: 'brand' | 'accent' | 'warm';
}) {
  const toneClass =
    tone === 'accent'
      ? 'border-accent-500/20 bg-accent-500/8 text-accent-400'
      : tone === 'warm'
        ? 'border-warm-500/20 bg-warm-500/8 text-warm-400'
        : 'border-brand-500/20 bg-brand-500/8 text-brand-400';

  return (
    <div className="result-card">
      <div className="result-card-header">
        <div className={`result-card-icon border ${toneClass}`}>{icon}</div>
        <h3 className="font-bold text-white">{title}</h3>
      </div>
      <div className="ml-[3.25rem] leading-relaxed text-surface-300">{children}</div>
    </div>
  );
}

export default function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [data, setData] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hintLevel, setHintLevel] = useState(1);
  const [extraHint, setExtraHint] = useState<string | null>(null);
  const [hintLoading, setHintLoading] = useState(false);
  const [showOcr, setShowOcr] = useState(false);
  const [hintMeta, setHintMeta] = useState<{ providerName?: string; fallbackUsed?: boolean } | null>(null);

  useEffect(() => {
    async function fetchResult() {
      try {
        const response = await fetch(`/api/submissions/${resolvedParams.id}`, {
          cache: 'no-store',
        });
        if (!response.ok) {
          throw new Error();
        }
        const json = (await response.json()) as ResultData;
        setData(json);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    fetchResult();
  }, [resolvedParams.id]);

  const requestExtraHint = async () => {
    if (hintLevel >= 2 || hintLoading) {
      return;
    }

    setHintLoading(true);
    try {
      const response = await fetch('/api/hints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId: resolvedParams.id, hintLevel: 2 }),
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || '추가 힌트를 생성하지 못했습니다.');
      }

      setExtraHint(json.hintText);
      setHintMeta({
        providerName: json.providerName,
        fallbackUsed: json.fallbackUsed,
      });
      setHintLevel(2);
    } catch {
      setExtraHint('막힌 줄의 목표가 무엇인지 먼저 적고, 그 목표에 필요한 값이 이미 있는지 다시 확인해 보세요.');
      setHintMeta({ providerName: 'fallback', fallbackUsed: true });
      setHintLevel(2);
    } finally {
      setHintLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="gradient-page flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 size={40} className="mx-auto mb-4 animate-spin text-brand-400" />
          <p className="font-medium text-surface-400">진단 결과를 불러오고 있습니다...</p>
        </div>
      </div>
    );
  }

  if (!data || !data.diagnosis) {
    return (
      <div className="gradient-page flex min-h-screen items-center justify-center">
        <div className="glass-card max-w-md p-10 text-center">
          <AlertTriangle size={40} className="mx-auto mb-4 text-warm-400" />
          <h2 className="mb-3 text-xl font-bold text-white">결과를 찾을 수 없습니다</h2>
          <p className="mb-6 text-sm text-surface-400">요청한 진단 결과가 존재하지 않거나 아직 준비되지 않았습니다.</p>
          <Link href="/student/upload" className="btn-primary">
            새 풀이 분석하기
          </Link>
        </div>
      </div>
    );
  }

  const diagnosis = data.diagnosis;

  return (
    <RoleGuard allowedRoles={['student']}>
      <div className="gradient-page min-h-screen">
        <div className="mx-auto max-w-5xl px-5 py-12 md:py-16">
        <Link href="/student/history" className="mb-8 inline-flex items-center gap-1.5 text-sm text-surface-500 transition-colors hover:text-brand-400">
          <ArrowLeft size={16} />
          학습 이력으로 돌아가기
        </Link>

        <div className="mb-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent-500/15 bg-accent-500/10 px-4 py-1.5 text-xs font-semibold text-accent-400">
            <Sparkles size={13} />
            진단 완료
          </div>
          <h1 className="text-3xl font-bold md:text-5xl">풀이 진단 결과</h1>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          <span className="badge badge-brand text-xs">
            <ShieldCheck size={10} className="mr-1" />
            {data.providerName || 'provider 없음'}
          </span>
          {data.promptVersion ? <span className="badge badge-accent text-xs">{data.promptVersion}</span> : null}
          {data.fallbackUsed ? <span className="badge badge-warm text-xs">fallback 사용</span> : null}
          {!data.leakageGuardPassed ? <span className="badge badge-warm text-xs">가드 보정 적용</span> : null}
        </div>

        {(data.problemImageUrl || data.solutionImageUrl) && (
          <div className="mb-8 grid gap-5 md:grid-cols-2">
            {data.problemImageUrl ? (
              <div className="glass-card p-5">
                <div className="mb-3 text-sm font-semibold text-surface-200">문제 이미지</div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={data.problemImageUrl} alt="문제 이미지" className="h-72 w-full rounded-2xl object-cover" />
              </div>
            ) : null}
            {data.solutionImageUrl ? (
              <div className="glass-card p-5">
                <div className="mb-3 text-sm font-semibold text-surface-200">풀이 이미지</div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={data.solutionImageUrl} alt="풀이 이미지" className="h-72 w-full rounded-2xl object-cover" />
              </div>
            ) : null}
          </div>
        )}

        <div className="space-y-4">
          <InfoCard title="문제 유형" icon={<Target size={18} />}>
            <p className="text-lg font-semibold text-surface-200">{diagnosis.problemType}</p>
          </InfoCard>

          <InfoCard title="잘한 부분" icon={<CheckCircle2 size={18} />} tone="accent">
            <p>{diagnosis.progressSummary}</p>
          </InfoCard>

          <InfoCard title="막힌 지점" icon={<AlertTriangle size={18} />} tone="warm">
            <p>{diagnosis.stuckPoint}</p>
          </InfoCard>

          <InfoCard title="오개념 태그" icon={<Tag size={18} />} tone="warm">
            <div className="flex flex-wrap gap-2">
              {diagnosis.misconceptionTags.map((tag) => (
                <span key={tag} className="badge badge-warm">
                  {tag}
                </span>
              ))}
            </div>
          </InfoCard>

          <InfoCard title="복습 추천 개념" icon={<BookOpen size={18} />}>
            <div className="flex flex-wrap gap-2">
              {diagnosis.conceptsToReview.map((concept) => (
                <span key={concept} className="badge badge-brand">
                  {concept}
                </span>
              ))}
            </div>
          </InfoCard>

          <InfoCard title="다음 단계 힌트" icon={<Lightbulb size={18} />} tone="accent">
            <p className="font-medium text-surface-200">{diagnosis.nextHint}</p>
          </InfoCard>

          {extraHint ? (
            <InfoCard title="추가 힌트" icon={<Lightbulb size={18} />} tone="warm">
              <div className="space-y-3">
                <p className="font-medium text-surface-200">{extraHint}</p>
                {hintMeta ? (
                  <div className="flex flex-wrap gap-2 text-xs">
                    {hintMeta.providerName ? <span className="badge badge-brand text-xs">{hintMeta.providerName}</span> : null}
                    {hintMeta.fallbackUsed ? <span className="badge badge-warm text-xs">fallback 사용</span> : null}
                  </div>
                ) : null}
              </div>
            </InfoCard>
          ) : null}

          <InfoCard title="다시 도전해볼 질문" icon={<HelpCircle size={18} />} tone="accent">
            <p className="italic text-surface-200">&quot;{diagnosis.retryQuestion}&quot;</p>
          </InfoCard>
        </div>

        {data.studentNote ? (
          <div className="mt-6 rounded-2xl border border-white/[0.06] bg-surface-900/40 p-5">
            <div className="mb-2 text-sm font-semibold text-surface-200">제출 메모</div>
            <p className="text-sm leading-relaxed text-surface-400">{data.studentNote}</p>
          </div>
        ) : null}

        {data.problemOcrText || data.solutionOcrText ? (
          <div className="mt-6">
            <button
              onClick={() => setShowOcr((value) => !value)}
              className="mb-3 flex items-center gap-2 text-sm text-surface-500 transition-colors hover:text-brand-400"
              id="toggle-ocr"
            >
              <ScanText size={15} />
              OCR 추출 텍스트 {showOcr ? '숨기기' : '보기'}
              {showOcr ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {showOcr ? (
              <div className="space-y-3">
                {data.problemOcrText ? (
                  <div className="result-card">
                    <div className="result-card-header">
                      <div className="result-card-icon border border-brand-500/15 bg-brand-500/10 text-brand-400">
                        <ScanText size={18} />
                      </div>
                      <h3 className="font-bold text-white">문제 OCR 텍스트</h3>
                    </div>
                    <pre className="ml-[3.25rem] whitespace-pre-wrap rounded-xl border border-white/[0.04] bg-surface-900/30 p-4 font-mono text-sm leading-relaxed text-surface-400">
                      {data.problemOcrText}
                    </pre>
                  </div>
                ) : null}
                {data.solutionOcrText ? (
                  <div className="result-card">
                    <div className="result-card-header">
                      <div className="result-card-icon border border-accent-500/15 bg-accent-500/10 text-accent-400">
                        <ScanText size={18} />
                      </div>
                      <h3 className="font-bold text-white">풀이 OCR 텍스트</h3>
                    </div>
                    <pre className="ml-[3.25rem] whitespace-pre-wrap rounded-xl border border-white/[0.04] bg-surface-900/30 p-4 font-mono text-sm leading-relaxed text-surface-400">
                      {data.solutionOcrText}
                    </pre>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          {hintLevel < 2 ? (
            <button onClick={requestExtraHint} disabled={hintLoading} className="btn-secondary flex-1" id="btn-extra-hint">
              {hintLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  힌트 생성 중...
                </>
              ) : (
                <>
                  <Lightbulb size={16} />
                  힌트 하나 더 보기
                </>
              )}
            </button>
          ) : null}
          <Link href="/student/upload" className="btn-primary flex-1 text-center" id="btn-new-analysis">
            새 풀이 분석하기 <ChevronRight size={16} />
          </Link>
        </div>

        <p className="mt-5 text-center text-xs text-surface-600">
          StepHint는 정답을 바로 제공하지 않고, 학생이 스스로 다음 단계를 생각하도록 돕습니다.
        </p>
      </div>
    </div>
    </RoleGuard>
  );
}
