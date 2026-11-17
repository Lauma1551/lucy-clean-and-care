import { MessageCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { FOUNDER_IMAGE_URL } from '../shared/defaults.ts';
import type { SiteConfig } from '../shared/types.ts';
import { ResilientImage } from './ResilientImage.tsx';

interface FounderSectionProps {
  config: SiteConfig;
  onBookClick?: () => void;
}

export function FounderSection({ config }: FounderSectionProps) {
  const founderName = config.founderName || 'Lucy Auma Aluoch';

  return (
    <section
      id="team"
      className="py-10 sm:py-14 bg-[#F4EFE6]/75 border-b border-[#DDD4C3]"
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="bg-[#FAF8F4] rounded-2xl border border-[#DDD4C3] p-5 sm:p-7 shadow-[0_10px_28px_-18px_rgba(27,67,50,0.12)]"
        >
          <h2 className="text-xs font-medium tracking-wide text-[#4F6F58] mb-3.5">
            Meet the Founder
          </h2>

          <div className="flex items-start sm:items-center gap-4 sm:gap-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 overflow-hidden rounded-xl border border-[#DDD4C3] bg-[#E7E0D3]">
              <ResilientImage
                src={FOUNDER_IMAGE_URL}
                alt={`${founderName}, Founder of ${config.businessName}`}
                fallbackTitle={founderName}
                className="w-full h-full object-cover object-[50%_18%]"
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="font-display text-lg sm:text-xl font-semibold text-[#222523] leading-snug">
                {founderName}
              </p>
              <p className="text-xs sm:text-sm font-medium text-[#4F6F58] mt-0.5 mb-2">
                Founder <span aria-hidden="true">|</span> {config.businessName}
              </p>
              <p className="text-sm text-[#3B3F3C] leading-relaxed">
                I founded {config.businessName} with a simple vision: to make homes cleaner, fresher
                and more comfortable through reliable and thoughtful cleaning services.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

interface FutureRecruitmentSectionProps {
  config: SiteConfig;
  onWhatsAppInquiry: (customMessage: string) => void;
}

export function FutureRecruitmentSection({
  config,
  onWhatsAppInquiry,
}: FutureRecruitmentSectionProps) {
  return (
    <section
      id="recruitment"
      className="py-16 sm:py-22 lg:py-24 border-b border-[#DDD4C3]"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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
            <h2 className="font-display text-2xl sm:text-3xl font-medium tracking-tight text-[#FAF8F4] [text-wrap:balance] mb-3">
              Growing our residential cleaning team.
            </h2>
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

interface TeamSectionProps {
  config: SiteConfig;
  onBookClick: () => void;
  onWhatsAppInquiry: (customMessage: string) => void;
}

export function TeamSection({ config, onBookClick, onWhatsAppInquiry }: TeamSectionProps) {
  return (
    <>
      <FutureRecruitmentSection config={config} onWhatsAppInquiry={onWhatsAppInquiry} />
      <FounderSection config={config} onBookClick={onBookClick} />
    </>
  );
}
