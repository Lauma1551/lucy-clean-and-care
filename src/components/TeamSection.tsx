import { ArrowRight, MessageCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { FOUNDER_IMAGE_URL } from '../shared/defaults.ts';
import type { SiteConfig } from '../shared/types.ts';
import { ResilientImage } from './ResilientImage.tsx';

interface TeamSectionProps {
  config: SiteConfig;
  onBookClick: () => void;
  onWhatsAppInquiry: (customMessage: string) => void;
}

export function TeamSection({ config, onBookClick, onWhatsAppInquiry }: TeamSectionProps) {
  return (
    <section
      id="team"
      className="py-16 sm:py-22 lg:py-24 bg-[#F4EFE6]/75 border-b border-[#DDD4C3]"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Meet the Founder Card */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="bg-[#FAF8F4] rounded-3xl border border-[#DDD4C3] p-6 sm:p-10 lg:p-12 shadow-[0_18px_42px_-18px_rgba(27,67,50,0.16)]"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Portrait Column */}
            <div className="lg:col-span-5 flex flex-col items-center lg:items-stretch">
              <div className="w-full max-w-[340px] lg:max-w-none mx-auto rounded-2xl bg-[#EFE9DC] p-3 sm:p-3.5 border border-[#DDD4C3] shadow-[0_12px_28px_-14px_rgba(27,67,50,0.15)]">
                <div className="aspect-[4/5] w-full overflow-hidden rounded-xl border border-[#1B4332]/20 bg-[#E7E0D3]">
                  <ResilientImage
                    src={FOUNDER_IMAGE_URL}
                    alt={`${config.founderName}, Founder of ${config.businessName}`}
                    fallbackTitle={config.founderName}
                    className="w-full h-full object-cover object-[50%_18%] scale-[1.06]"
                  />
                </div>
                <div className="pt-3.5 px-1">
                  <p className="font-display text-base font-medium text-[#222523]">
                    {config.founderName}
                  </p>
                  <p className="text-xs text-[#4F6F58] font-medium mt-0.5">
                    Founder <span aria-hidden="true">|</span> {config.businessName}
                  </p>
                </div>
              </div>
            </div>

            {/* Founder Introduction Column */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              <p className="text-xs font-medium tracking-wide text-[#1B4332] mb-2.5">
                About the Founder
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-medium tracking-tight text-[#222523] [text-wrap:balance] mb-2.5">
                Meet the Founder
              </h2>
              <div className="mb-6">
                <p className="font-display text-xl font-medium text-[#222523]">
                  {config.founderName}
                </p>
                <p className="text-sm font-medium text-[#4F6F58] mt-0.5">
                  Founder <span aria-hidden="true">|</span> {config.businessName}
                </p>
              </div>

              <div className="space-y-4 text-base text-[#3B3F3C] leading-relaxed">
                {config.founderBio
                  .split(/\n\s*\n/)
                  .map((paragraph) => paragraph.trim())
                  .filter(Boolean)
                  .map((paragraph, idx) => (
                    <p key={idx}>{paragraph}</p>
                  ))}
              </div>

              <div className="mt-8 pt-6 border-t border-[#DDD4C3] flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={onBookClick}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] text-sm font-medium text-white bg-[#1B4332] hover:bg-[#143325] rounded-xl shadow-[0_8px_18px_-8px_rgba(27,67,50,0.45)] transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4332]"
                >
                  <span>Book a Cleaning</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Future Recruitment */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="bg-[#1B4332] text-[#FAF8F4] rounded-3xl p-7 sm:p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8 shadow-[0_18px_40px_-18px_rgba(27,67,50,0.35)]"
        >
          <div className="max-w-2xl">
            <p className="text-xs font-medium tracking-wide text-[#DCE6DD] mb-2.5">
              Future Recruitment
            </p>
            <h3 className="font-display text-2xl sm:text-3xl font-medium tracking-tight text-[#FAF8F4] [text-wrap:balance] mb-3">
              Growing our residential cleaning team.
            </h3>
            <p className="text-sm sm:text-base text-[#E6ECE7] leading-relaxed mb-5">
              As {config.businessName} expands across {config.serviceAreas.toLowerCase()}, we
              welcome expressions of interest from dependable, detail-oriented residential cleaners
              who take pride in caring for people&apos;s homes.
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs sm:text-sm text-[#DCE6DD]">
              <span>· Reliable &amp; punctual</span>
              <span>· Respectful home care</span>
              <span>· Roysambu &amp; nearby estates</span>
            </div>
          </div>

          <div className="shrink-0">
            <button
              type="button"
              onClick={() =>
                onWhatsAppInquiry(
                  `Hello ${config.businessName}, I am reaching out to express interest in future cleaning team opportunities in Roysambu, Nairobi.`
                )
              }
              className="inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[44px] text-sm font-medium text-[#1B4332] bg-[#FAF8F4] hover:bg-[#DCE6DD] rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FAF8F4]"
            >
              <MessageCircle className="w-4 h-4 text-[#1B4332]" aria-hidden="true" />
              <span>Express Interest via WhatsApp</span>
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
