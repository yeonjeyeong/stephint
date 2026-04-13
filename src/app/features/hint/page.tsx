import Link from 'next/link';
import { Lightbulb, ArrowLeft, Compass, MoveRight } from 'lucide-react';

export default function HintFeaturePage() {
  return (
    <div className="gradient-page min-h-screen">
      <div className="mx-auto max-w-4xl px-5 py-16 md:py-24">
        <Link href="/" className="mb-8 inline-flex items-center gap-1.5 text-sm text-surface-500 transition-colors hover:text-brand-400">
          <ArrowLeft size={16} />
          돌아가기
        </Link>
        
        <div className="mb-12">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent-500/15 bg-accent-500/10 px-4 py-1.5 text-xs font-semibold text-accent-400">
            <Lightbulb size={13} />
            핵심 가치 2
          </div>
          <h1 className="mb-5 text-4xl font-bold md:text-5xl">정답 대신 생각의 길을 열어주는<br/>다음 한 단계 힌트</h1>
          <p className="max-w-2xl text-lg leading-relaxed text-surface-400">
            StepHint는 해설지를 통째로 주지 않습니다. 학생이 막힌 지점 바로 다음의 '딱 한 단계'만을 힌트로 제공하여, 스스로 사고하고 문제를 해결하는 힘을 기르도록 유도합니다.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="glass-card p-8">
            <Compass size={32} className="mb-4 text-accent-400" />
            <h3 className="mb-3 text-xl font-bold text-white">막힌 지점을 기준으로</h3>
            <p className="text-sm leading-relaxed text-surface-400">
              풀이를 분석해 학생이 정확히 어디서 막혔는지를 찾아냅니다. 그리고 그 위치에서 어떤 값을 더 구해야 하는지, 방향성을 제시합니다.
            </p>
          </div>
          <div className="glass-card p-8">
            <MoveRight size={32} className="mb-4 text-brand-400" />
            <h3 className="mb-3 text-xl font-bold text-white">단계적 힌트 제공</h3>
            <p className="text-sm leading-relaxed text-surface-400">
              한 단계 힌트만으로 부족할 경우, 추가 힌트를 요청해 조금 더 구체적인 질문을 던지며 학생이 스스로 다음 스텝을 밟도록 코칭합니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
