import Link from 'next/link';
import { Target, ArrowLeft, BrainCircuit, Activity } from 'lucide-react';

export default function MisconceptionFeaturePage() {
  return (
    <div className="gradient-page min-h-screen">
      <div className="mx-auto max-w-4xl px-5 py-16 md:py-24">
        <Link href="/" className="mb-8 inline-flex items-center gap-1.5 text-sm text-surface-500 transition-colors hover:text-brand-400">
          <ArrowLeft size={16} />
          돌아가기
        </Link>
        
        <div className="mb-12">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-500/15 bg-brand-500/10 px-4 py-1.5 text-xs font-semibold text-brand-400">
            <Target size={13} />
            핵심 가치 1
          </div>
          <h1 className="mb-5 text-4xl font-bold md:text-5xl">학생의 사고 흐름을 추적하는<br/>오개념 진단</h1>
          <p className="max-w-2xl text-lg leading-relaxed text-surface-400">
            단순히 정답이 틀렸는지를 채점하는 것이 아니라, 학생이 어떤 논리적 오류를 범했는지 파악합니다. 수식을 전개하는 과정에서 잘못 적용된 개념(오개념)을 찾아내어 근본적인 문제 해결을 돕습니다.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="glass-card p-8">
            <BrainCircuit size={32} className="mb-4 text-brand-400" />
            <h3 className="mb-3 text-xl font-bold text-white">행간의 의미 분석</h3>
            <p className="text-sm leading-relaxed text-surface-400">
              학생이 제출한 풀이 이미지에서 텍스트를 추출하고, 이전 수식에서 다음 수식으로 넘어갈 때 어떤 논리적 비약이나 실수가 있었는지 면밀히 분석합니다.
            </p>
          </div>
          <div className="glass-card p-8">
            <Activity size={32} className="mb-4 text-accent-400" />
            <h3 className="mb-3 text-xl font-bold text-white">반복되는 실수 포착</h3>
            <p className="text-sm leading-relaxed text-surface-400">
              특정 학생이 반복적으로 범하는 오개념을 태그 형태로 누적 기록합니다. 이를 통해 학생 스스로도 자신이 취약한 부분을 명확히 인지하게 됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
