import { ArrowRight, MessageCircle } from 'lucide-react';
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
      className="pt-10 pb-16 sm:pt-14 sm:pb-20 lg:pt-16 lg:pb-24 border-b border-[#DDD4C3] bg-gradient-to-b from-[#FAF8F4] via-[#FAF8F4] to-[#F5F0E6]/60"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Copy & Booking CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 flex flex-col justify-center"
          >
            <p className="text-xs sm:text-sm font-medium text-[#1B4332] tracking-wide mb-4">
              {config.city} <span aria-hidden="true" className="mx-1.5 text-[#8FA896]">·</span>{' '}
              {config.tagline}
            </p>

            <h1 className="font-display text-[clamp(2.25rem,3.9vw,3.5rem)] font-medium leading-[1.09] tracking-tight text-[#222523] [text-wrap:balance] mb-6">
              Your Home Deserves a Fresh Start.
            </h1>

            <p className="text-base sm:text-[17px] text-[#4E544F] leading-relaxed max-w-xl mb-8">
              Enjoy a cleaner, fresher and more comfortable home with {config.businessName}. We
              provide reliable residential cleaning services in {config.serviceAreas.toLowerCase()},
              designed around your home, your schedule and your needs.
            </p>

            <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-stretch sm:items-center lg:items-stretch xl:items-center gap-3.5">
              <button
                type="button"
                onClick={onBookClick}
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 min-h-[48px] text-sm sm:text-base font-medium text-white bg-[#1B4332] hover:bg-[#143325] rounded-xl shadow-[0_10px_24px_-8px_rgba(27,67,50,0.45)] transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4332] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF8F4]"
              >
                <span>Book a Cleaning</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={onWhatsAppClick}
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 min-h-[48px] text-sm sm:text-base font-medium text-[#1B4332] bg-[#F4EFE6] hover:bg-[#E9E2D4] border border-[#C9C1B0] rounded-xl transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4332] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF8F4]"
              >
                <MessageCircle className="w-4 h-4 text-[#1B4332]" aria-hidden="true" />
                <span>Book on WhatsApp</span>
              </button>
            </div>

            <div className="mt-9 pt-6 border-t border-[#DDD4C3] flex flex-wrap items-center gap-x-5 gap-y-2 text-xs sm:text-sm text-[#525753]">
              <span>Bedsitters to family houses</span>
              <span aria-hidden="true" className="text-[#8FA896]">·</span>
              <span>Flexible product options</span>
              <span aria-hidden="true" className="text-[#8FA896]">·</span>
              <span>Kenyan Shillings (KES)</span>
            </div>
          </motion.div>

          {/* Right Split-Screen Feature Photograph */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7"
          >
            <div className="rounded-3xl bg-[#EFE9DC] p-2.5 sm:p-3.5 border border-[#DDD4C3] shadow-[0_24px_60px_-18px_rgba(27,67,50,0.2)]">
              <div className="aspect-[3/2] w-full rounded-2xl overflow-hidden bg-[#E7E0D3] border border-[#1B4332]/15">
                <ResilientImage
                  src={HERO_IMAGE_URL}
                  alt="Founder Lucy Auma Aluoch of Lucy Clean & Care in white polo shirt with green piping, forest-green apron, and yellow gloves cleaning a bright modern living room"
                  fallbackTitle={config.businessName}
                  loading="eager"
                  className="w-full h-full object-cover object-top"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
