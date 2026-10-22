'use client';

import Image from 'next/image';
import { useState } from 'react';

interface SeriesCoverImageProps {
  readonly src: string;
  readonly sizes: string;
  readonly className?: string;
  readonly priority?: boolean;
}

export function SeriesCoverImage({
  src,
  sizes,
  className,
  priority = false,
}: SeriesCoverImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (failedSrc === src) return null;

  return (
    <Image
      src={src}
      alt=""
      fill
      priority={priority}
      sizes={sizes}
      className={className}
      onError={() => setFailedSrc(src)}
    />
  );
}
