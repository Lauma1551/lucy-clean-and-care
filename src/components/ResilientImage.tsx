import { useState } from 'react';
import { Home } from 'lucide-react';

interface ResilientImageProps {
  src: string;
  alt: string;
  fallbackTitle: string;
  className?: string;
  loading?: 'eager' | 'lazy';
}

export function ResilientImage({
  src,
  alt,
  fallbackTitle,
  className = 'w-full h-full object-cover',
  loading = 'lazy',
}: ResilientImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className="w-full h-full bg-gradient-to-br from-[#F1ECE3] via-[#E8E2D6] to-[#DCE6DD] flex flex-col items-center justify-center p-6 text-center"
      >
        <div className="w-11 h-11 rounded-full bg-[#FAF8F4] border border-[#DFD6C7] flex items-center justify-center text-[#4F6F58] mb-3">
          <Home className="w-5 h-5" aria-hidden="true" />
        </div>
        <span className="font-display text-sm font-medium text-[#222523] max-w-[18ch]">
          {fallbackTitle}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}
