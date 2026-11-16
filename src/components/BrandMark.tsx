import { LOGO_IMAGE_URL } from '../shared/defaults.ts';

interface BrandMarkProps {
  logoText?: string;
  className?: string;
  dark?: boolean;
  variant?: 'header' | 'footer';
}

export function BrandMark({
  logoText = 'LUCY CLEAN & CARE',
  className = '',
  dark = false,
  variant = 'header',
}: BrandMarkProps) {
  if (variant === 'footer') {
    return (
      <div className={`inline-block shrink-0 ${className}`}>
        <div className="w-24 h-24 sm:w-28 sm:h-28 aspect-square rounded-2xl overflow-hidden border border-[#DDD4C3] bg-[#EFE9DC] shadow-[0_10px_24px_-12px_rgba(27,67,50,0.2)]">
          <img
            src={LOGO_IMAGE_URL}
            alt="Lucy Clean & Care – A cleaner home, a happier you."
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    );
  }

  return (
    <span className={`inline-flex items-center gap-3 whitespace-nowrap shrink-0 ${className}`}>
      <span className="w-11 h-11 sm:w-12 sm:h-12 aspect-square rounded-xl overflow-hidden border border-[#DDD4C3] bg-[#EFE9DC] shadow-xs shrink-0">
        <img
          src={LOGO_IMAGE_URL}
          alt="Lucy Clean & Care logo"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </span>
      <span
        className={`font-display text-sm sm:text-base lg:text-lg font-semibold tracking-[0.03em] ${
          dark ? 'text-[#FAF8F4]' : 'text-[#1B4332]'
        }`}
      >
        {logoText}
      </span>
    </span>
  );
}
