'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  Loader2,
  NotebookPen,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import { RoleGuard } from '@/components/auth/RoleGuard';

type UploadState = 'empty' | 'drag-over' | 'selected';

interface FileUploadZoneProps {
  label: string;
  description: string;
  selectedDescription: string;
  helper: string;
  file: File | null;
  onFileSelect: (file: File) => void;
  onFileClear: () => void;
  accept: string;
  id: string;
}

function FileUploadZone({
  label,
  description,
  selectedDescription,
  helper,
  file,
  onFileSelect,
  onFileClear,
  accept,
  id,
}: FileUploadZoneProps) {
  const [dragState, setDragState] = useState<UploadState>('empty');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setDragState('drag-over');
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragState(file ? 'selected' : 'empty');
  }, [file]);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const droppedFile = event.dataTransfer.files[0];
      if (droppedFile) {
        onFileSelect(droppedFile);
        setDragState('selected');
      }
    },
    [onFileSelect]
  );

  const handleClick = () => inputRef.current?.click();

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      onFileSelect(selectedFile);
      setDragState('selected');
    }
  };

  const stateClass = file ? 'has-file' : dragState === 'drag-over' ? 'drag-over' : '';

  return (
    <div className="w-full">
      <label className="mb-2.5 block text-sm font-semibold text-surface-200">{label}</label>
      <div
        className={`upload-zone ${stateClass} ${file ? '!p-4' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        id={id}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
        />

        {file && previewUrl ? (
          <div className="w-full">
            <div className="relative overflow-hidden rounded-[1.35rem] border border-white/10 bg-surface-950/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt={selectedDescription} className="h-60 w-full object-cover" />
              <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-[rgba(10,22,38,0.85)] px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                <CheckCircle2 size={13} className="text-accent-300" />
                사진 선택 완료
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="min-w-0 text-left">
                <p className="text-sm font-semibold text-white">{selectedDescription}</p>
                <p className="text-xs text-surface-400">{helper}</p>
              </div>
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  onFileClear();
                  setDragState('empty');
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs text-red-200 transition-colors hover:bg-red-400/15"
              >
                <X size={14} />
                제거
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(255,236,207,0.1)] text-[#ffd59d]">
              <ImageIcon size={28} />
            </div>
            <p className="text-sm font-semibold text-white">{description}</p>
            <p className="text-xs text-surface-400">클릭하거나 파일을 드래그하세요</p>
            <p className="text-xs text-surface-500">{helper}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function UploadPage() {
  const router = useRouter();
  const [problemFile, setProblemFile] = useState<File | null>(null);
  const [solutionFile, setSolutionFile] = useState<File | null>(null);
  const [studentNote, setStudentNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = !!problemFile && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit || !problemFile) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('problemImage', problemFile);
      if (solutionFile) {
        formData.append('solutionImage', solutionFile);
      }
      if (studentNote) {
        formData.append('studentNote', studentNote);
      }

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '분석 요청에 실패했습니다.');
      }

      router.push(`/student/result/${data.submissionId}`);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : '분석 중 문제가 발생했습니다.'
      );
      setIsSubmitting(false);
    }
  };

  return (
    <RoleGuard allowedRoles={['student']}>
      <div className="gradient-page min-h-screen">
        <div className="mx-auto max-w-6xl px-5 py-14 md:py-20">
          <div className="mb-10 max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-xs font-semibold text-[#ffe3b5]">
              <Upload size={13} />
              오늘의 풀이 올리기
            </div>
            <h1 className="mb-4 text-4xl text-white md:text-5xl">문제만 올려도 진단을 시작할 수 있어요</h1>
            <p className="text-lg leading-relaxed text-surface-300">
              아직 풀이를 시작하기 전이어도 괜찮습니다. 문제 이미지만 올리면 StepHint가
              어디서 막힐 수 있는지 먼저 짚어주고, 풀이 이미지까지 함께 올리면 더 정확한 피드백을 받을 수 있어요.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <section className="glass-card p-7 md:p-8">
              <div className="mb-7 grid grid-cols-1 gap-6 md:grid-cols-2">
                <FileUploadZone
                  label="문제 이미지"
                  description="문제 사진을 꼭 올려 주세요"
                  selectedDescription="선택한 문제 이미지"
                  helper="PNG, JPG, WEBP · 최대 10MB"
                  file={problemFile}
                  onFileSelect={setProblemFile}
                  onFileClear={() => setProblemFile(null)}
                  accept="image/*"
                  id="upload-problem"
                />
                <FileUploadZone
                  label="풀이 이미지 (선택)"
                  description="풀이가 있다면 함께 올려 주세요"
                  selectedDescription="선택한 풀이 이미지"
                  helper="없어도 진단은 시작할 수 있어요"
                  file={solutionFile}
                  onFileSelect={setSolutionFile}
                  onFileClear={() => setSolutionFile(null)}
                  accept="image/*"
                  id="upload-solution"
                />
              </div>

              <div className="mb-6">
                <label className="mb-2.5 block text-sm font-semibold text-surface-200">
                  <FileText size={13} className="mr-1.5 inline" />
                  메모 남기기 (선택)
                </label>
                <textarea
                  value={studentNote}
                  onChange={(event) => setStudentNote(event.target.value)}
                  placeholder="예: 어디서부터 시작해야 할지 모르겠어요, 이 개념이 헷갈려요"
                  className="w-full resize-none rounded-[1.35rem] border border-white/10 bg-[rgba(255,255,255,0.05)] px-4 py-4 text-sm text-white outline-none transition placeholder:text-surface-500 focus:border-[rgba(255,231,175,0.35)] focus:ring-2 focus:ring-[rgba(255,231,175,0.12)]"
                  rows={4}
                  id="upload-note"
                />
              </div>

              {error ? (
                <div className="mb-5 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              ) : null}

              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="btn-primary w-full !py-4 text-base"
                id="upload-submit"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    AI가 문제를 읽는 중이에요...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    풀이 진단 시작하기
                  </>
                )}
              </button>

              {!problemFile ? (
                <p className="mt-4 text-center text-xs text-surface-500">
                  문제 이미지를 올리면 진단을 시작할 수 있습니다.
                </p>
              ) : !solutionFile ? (
                <p className="mt-4 text-center text-xs text-surface-500">
                  풀이 이미지가 없어도 괜찮아요. 지금 상태로도 진단을 시작할 수 있습니다.
                </p>
              ) : (
                <p className="mt-4 text-center text-xs text-surface-500">
                  문제와 풀이를 함께 올려서 더 풍부한 힌트를 받을 준비가 됐어요.
                </p>
              )}
            </section>

            <aside className="glass-card p-7 md:p-8">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(255,236,207,0.1)] text-[#ffd59d]">
                  <NotebookPen size={22} />
                </div>
                <div>
                  <div className="text-lg text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                    올리기 전에 가볍게 체크
                  </div>
                  <div className="text-sm text-surface-400">풀이가 없어도, 지금 헷갈리는 지점부터 시작할 수 있어요</div>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  {
                    title: '문제 이미지만 있어도 괜찮아요',
                    desc: '아직 시작 전이라면 문제만 올리고 “어디서부터 풀어야 할지 모르겠어요”라고 적어도 됩니다.',
                  },
                  {
                    title: '풀이가 있으면 더 정확해져요',
                    desc: '내가 어디까지 시도했는지 보이면 막힌 지점을 더 선명하게 짚어줄 수 있습니다.',
                  },
                  {
                    title: '한 줄 메모만 있어도 도움이 돼요',
                    desc: '헷갈린 부분을 적어두면 힌트가 더 자연스럽고 현실적으로 바뀝니다.',
                  },
                ].map((item, index) => (
                  <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="mb-2 text-sm font-semibold text-white">
                      {index + 1}. {item.title}
                    </div>
                    <p className="text-sm leading-relaxed text-surface-400">{item.desc}</p>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
