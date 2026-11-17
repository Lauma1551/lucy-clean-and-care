import { ChevronRight, MessageCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { HERO_IMAGE_URL } from '../shared/defaults.ts';
import type { SiteConfig } from '../shared/types.ts';
import { ResilientImage } from './ResilientImage.tsx';

interface HeroProps {
  config: SiteConfig;
  onBookClick: () => void;
  onWhatsAppClick: () => void;
}

export function Hero({ config, onBookClick, onWhatsAppClick }: HeroProps) {
  return (
    <section
      id="top"
      className="relative w-full h-[calc(100svh-4rem)] sm:h-[calc(100svh-4.5rem)] min-h-[520px] max-h-[820px] overflow-hidden bg-[#1B4332] border-b border-[#DDD4C3]"
    >
      {/* Full-Width Hero Cleaning Photograph */}
      <div className="absolute inset-0">
        <ResilientImage
          src={HERO_IMAGE_URL}
          alt="Lucy Clean & Care founder cleaning a bright modern living room in her forest-green apron and yellow gloves"
          fallbackTitle={config.businessName}
          loading="eager"
          className="w-full h-full object-cover object-[44%_18%] sm:object-[50%_16%]"
        />
        {/* Subtle bottom-weighted scrim to preserve full visual clarity of the photograph while keeping minimal text readable */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-[#0F241A]/75 via-[#0F241A]/15 to-transparent"
        />
      </div>

      {/* Minimal Bottom-Anchored Caption & Actions */}
      <div className="relative z-10 h-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-7 sm:pb-10 lg:pb-12 flex items-end">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="w-full flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-8"
        >
          <div className="max-w-xl">
            <h1 className="font-display text-3xl sm:text-4xl lg:text-[2.65rem] font-semibold tracking-tight text-white [text-wrap:balance] leading-[1.12] mb-2">
              A Cleaner Home, A Happier You.
            </h1>
            <p className="text-sm sm:text-base text-white/90 leading-relaxed">
              Reliable residential cleaning for homes in {config.serviceAreas.toLowerCase()}.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onBookClick}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[46px] text-sm font-semibold text-[#1B4332] bg-[#FAF8F4] hover:bg-[#DCE6DD] rounded-xl shadow-[0_10px_24px_-10px_rgba(0,0,0,0.45)] transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FAF8F4]"
            >
              <span>Book a Cleaning</span>
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={onWhatsAppClick}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[46px] text-sm font-medium text-white bg-[#1B4332]/85 hover:bg-[#1B4332] border border-white/25 backdrop-blur-sm rounded-xl transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FAF8F4]"
            >
              <MessageCircle className="w-4 h-4" aria-hidden="true" />
              <span>Book on WhatsApp</span>
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
