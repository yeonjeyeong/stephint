import Link from 'next/link';
import { Users, ArrowLeft, BarChart3, AlertTriangle } from 'lucide-react';

export default function InsightFeaturePage() {
  return (
    <div className="gradient-page min-h-screen">
      <div className="mx-auto max-w-4xl px-5 py-16 md:py-24">
        <Link href="/" className="mb-8 inline-flex items-center gap-1.5 text-sm text-surface-500 transition-colors hover:text-brand-400">
          <ArrowLeft size={16} />
          돌아가기
        </Link>
        
        <div className="mb-12">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-warm-500/15 bg-warm-500/10 px-4 py-1.5 text-xs font-semibold text-warm-400">
            <Users size={13} />
            핵심 가치 3
          </div>
          <h1 className="mb-5 text-4xl font-bold md:text-5xl">선생님을 위한 데이터 기반<br/>교사용 집단 인사이트</h1>
          <p className="max-w-2xl text-lg leading-relaxed text-surface-400">
            연결된 학생들의 풀이 진단 결과가 교사 대시보드에 모입니다. 어떤 학생들이 어떤 오개념을 자주 겪는지 파악하고, 개입이 필요한 학생에게 적절한 지도를 제공할 수 있습니다.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="glass-card p-8">
            <BarChart3 size={32} className="mb-4 text-brand-400" />
            <h3 className="mb-3 text-xl font-bold text-white">학급 전체 트렌드 분석</h3>
            <p className="text-sm leading-relaxed text-surface-400">
              가장 많이 발생한 오개념 태그와 많이 틀린 문제를 한눈에 확인하여, 다음 수업 시간에 중점적으로 복습해야 할 개념을 쉽게 정할 수 있습니다.
            </p>
          </div>
          <div className="glass-card p-8">
            <AlertTriangle size={32} className="mb-4 text-warm-400" />
            <h3 className="mb-3 text-xl font-bold text-white">개입 필요 학생 알림</h3>
            <p className="text-sm leading-relaxed text-surface-400">
              여러 번 동일한 오개념에 반복해서 부딪히거나, 진전이 없는 학생을 AI가 감지해 선생님에게 즉각적인 오프라인/온라인 개입을 추천합니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
