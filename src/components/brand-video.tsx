'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * A compressed ambient video with a poster fallback.
 * Motion is disabled automatically for visitors who prefer reduced motion.
 */
export function BrandVideo({
  src,
  poster,
  className,
  label = 'HUConnect',
  preload = 'auto',
}: {
  src: string;
  poster: string;
  className?: string;
  label?: string;
  preload?: 'auto' | 'metadata' | 'none';
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    const play = () => video.play().catch(() => {});
    play();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') play();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [reducedMotion]);

  if (reducedMotion) {
    return (
      <div
        role="img"
        aria-label={label}
        className={cn('bg-cover bg-center', className)}
        style={{ backgroundImage: `url(${poster})` }}
      />
    );
  }

  return (
    <video
      ref={videoRef}
      className={cn('object-cover', className)}
      autoPlay
      muted
      loop
      playsInline
      preload={preload}
      poster={poster}
      aria-hidden="true"
      tabIndex={-1}
      disablePictureInPicture
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
