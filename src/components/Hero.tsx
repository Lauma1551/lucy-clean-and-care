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
      className="bg-[#F6F5F1] border-b border-[#DDD4C3] overflow-hidden"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          {/* Left Copy & Booking CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 py-12 sm:py-16 lg:py-24 flex flex-col justify-center"
          >
            {/* Broom Icon + Eyebrow + Headline Lockup */}
            <div className="flex items-start gap-3.5 sm:gap-4">
              <svg
                viewBox="0 0 48 48"
                fill="none"
                aria-hidden="true"
                className="w-10 h-10 sm:w-11 sm:h-11 text-[#1B4332] shrink-0 mt-0.5"
              >
                <path
                  d="M35.5 7.5L22.5 23.5"
                  stroke="currentColor"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                />
                <path
                  d="M18.2 21.6L26.8 28.4L24.5 31.3L15.9 24.5L18.2 21.6Z"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinejoin="round"
                />
                <path
                  d="M16.2 24.8L8.5 34.8C12.2 37.6 17.6 39.2 22.8 39.5L24.6 31.2"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M13.5 31.2L11.5 35.8M18.2 33.4L16.8 38.2"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle cx="28.5" cy="36.5" r="1.4" fill="currentColor" />
                <circle cx="32.5" cy="34" r="1.1" fill="currentColor" />
                <circle cx="26.5" cy="40" r="1" fill="currentColor" />
              </svg>

              <div className="min-w-0">
                <p className="text-xs font-medium tracking-[0.18em] text-[#4F6F58] mb-1.5">
                  {config.city} <span aria-hidden="true" className="mx-1 text-[#8FA896]">·</span>{' '}
                  {config.tagline}
                </p>
                <h1 className="font-display text-[clamp(2rem,3.6vw,3.1rem)] font-semibold leading-[1.12] tracking-tight text-[#222523] [text-wrap:balance]">
                  Your Home Deserves a Fresh Start.
                </h1>
              </div>
            </div>

            {/* Warm Gold Accent Bar (Matching Reference Hero) */}
            <div
              aria-hidden="true"
              className="w-14 h-[3px] bg-[#EAB308] rounded-full mt-5 mb-6"
            />

            <p className="text-base sm:text-[17px] text-[#525753] leading-[1.75] max-w-xl mb-8">
              Enjoy a cleaner, fresher and more comfortable home with {config.businessName}. We
              provide reliable residential cleaning services in {config.serviceAreas.toLowerCase()},
              designed around your home, your schedule and your needs.
            </p>

            <div className="flex flex-wrap items-center gap-3.5">
              <button
                type="button"
                onClick={onBookClick}
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 min-h-[48px] text-sm font-semibold tracking-wide text-white bg-[#1B4332] hover:bg-[#143325] rounded-lg shadow-[0_10px_22px_-10px_rgba(27,67,50,0.48)] transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4332] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F6F5F1]"
              >
                <span>Book a Cleaning</span>
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={onWhatsAppClick}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 min-h-[48px] text-sm font-medium text-[#1B4332] bg-white hover:bg-[#EFECE4] border border-[#DDD4C3] rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4332] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F6F5F1]"
              >
                <MessageCircle className="w-4 h-4 text-[#1B4332]" aria-hidden="true" />
                <span>Book on WhatsApp</span>
              </button>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs sm:text-sm text-[#525753]">
              <span>Bedsitters to family houses</span>
              <span aria-hidden="true" className="text-[#8FA896]">·</span>
              <span>Flexible product options</span>
              <span aria-hidden="true" className="text-[#8FA896]">·</span>
              <span>Kenyan Shillings (KES)</span>
            </div>
          </motion.div>

          {/* Right Bottom-Anchored Founder Cleaning Photograph */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 flex items-end justify-center lg:justify-end pt-0 lg:pt-10"
          >
            <div className="w-full max-w-xl lg:max-w-none aspect-[3/2] lg:aspect-auto lg:h-[92%] lg:min-h-[420px] rounded-t-2xl overflow-hidden bg-[#E7E0D3] border-x border-t border-[#DDD4C3] shadow-[0_-10px_34px_-18px_rgba(27,67,50,0.2)]">
              <ResilientImage
                src={HERO_IMAGE_URL}
                alt="Founder Lucy Auma Aluoch of Lucy Clean & Care in white polo shirt with green piping, forest-green apron, and yellow gloves cleaning a bright modern living room"
                fallbackTitle={config.businessName}
                loading="eager"
                className="w-full h-full object-cover object-top"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
