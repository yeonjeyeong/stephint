'use client';

import { useEffect, useState } from 'react';
import { Expand, X } from 'lucide-react';

function cx(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(' ');
}

interface ZoomableSubmissionImageProps {
  src: string;
  alt: string;
  label: string;
  className?: string;
  frameClassName?: string;
  imageClassName?: string;
  lightboxImageClassName?: string;
}

export function ZoomableSubmissionImage({
  src,
  alt,
  label,
  className,
  frameClassName = 'aspect-[4/3]',
  imageClassName,
  lightboxImageClassName,
}: ZoomableSubmissionImageProps) {
  const [canHoverZoom, setCanHoverZoom] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    const syncHoverMode = () => setCanHoverZoom(mediaQuery.matches);

    syncHoverMode();

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', syncHoverMode);
      return () => mediaQuery.removeEventListener('change', syncHoverMode);
    }

    mediaQuery.addListener(syncHoverMode);
    return () => mediaQuery.removeListener(syncHoverMode);
  }, []);

  useEffect(() => {
    if (!viewerOpen || typeof window === 'undefined') {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setViewerOpen(false);
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [viewerOpen]);

  const handleMouseMove = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!canHoverZoom) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    setZoomPosition({
      x: Math.min(100, Math.max(0, x)),
      y: Math.min(100, Math.max(0, y)),
    });
  };

  const resetZoom = () => setZoomPosition({ x: 50, y: 50 });

  return (
    <>
      <button
        type="button"
        onClick={() => setViewerOpen(true)}
        onMouseMove={handleMouseMove}
        onMouseLeave={resetZoom}
        className={cx(
          'group block w-full cursor-zoom-in overflow-hidden rounded-[1.4rem] border border-white/[0.06] bg-surface-950/75 text-left shadow-[0_14px_30px_rgba(4,12,24,0.3)] outline-none transition focus-visible:ring-2 focus-visible:ring-brand-400/50',
          className
        )}
        aria-label={`${label} 크게 보기`}
      >
        <div className={cx('relative w-full overflow-hidden', frameClassName)}>
          <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_42%)] opacity-90" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className={cx(
              'h-full w-full object-cover transition-transform duration-300 ease-out will-change-transform',
              canHoverZoom ? 'group-hover:scale-[1.9]' : 'group-active:scale-[1.03]',
              imageClassName
            )}
            style={
              canHoverZoom
                ? { transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%` }
                : undefined
            }
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-center justify-between gap-3 bg-gradient-to-t from-surface-950/95 via-surface-950/35 to-transparent px-4 py-3">
            <span className="text-sm font-semibold text-white">{label}</span>
            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-surface-950/60 px-2.5 py-1 text-[11px] font-semibold text-surface-200">
              <Expand size={12} />
              {canHoverZoom ? '호버 확대' : '탭 확대'}
            </span>
          </div>
        </div>
      </button>

      {viewerOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${label} 확대 이미지`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-surface-950/88 px-4 py-6 backdrop-blur-md animate-fade-in"
          onClick={() => setViewerOpen(false)}
        >
          <button
            type="button"
            onClick={() => setViewerOpen(false)}
            className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-surface-900/85 text-white shadow-lg transition hover:border-brand-400/40 hover:text-brand-200"
            aria-label="확대 이미지 닫기"
          >
            <X size={18} />
          </button>

          <div
            className="w-full max-w-5xl animate-slide-up"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-3 px-1">
              <div className="text-sm font-semibold text-white">{label}</div>
              <div className="text-xs text-surface-400">이미지를 다시 누르면 닫힙니다</div>
            </div>

            <button
              type="button"
              onClick={() => setViewerOpen(false)}
              className="block w-full overflow-hidden rounded-[2rem] border border-white/[0.08] bg-surface-950/95 shadow-[0_24px_60px_rgba(4,12,24,0.45)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={alt}
                className={cx(
                  'max-h-[78vh] w-full object-contain bg-surface-950',
                  lightboxImageClassName
                )}
              />
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
