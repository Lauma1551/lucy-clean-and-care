import { motion } from 'motion/react';
import type { SiteConfig } from '../shared/types.ts';

interface AboutSectionProps {
  config: SiteConfig;
}

export function AboutSection({ config }: AboutSectionProps) {
  return (
    <section
      id="about"
      className="py-16 sm:py-22 lg:py-24 bg-[#F4EFE6]/75 border-b border-[#DDD4C3]"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start"
        >
          <div className="lg:col-span-5">
            <p className="text-xs font-medium tracking-wide text-[#1B4332] mb-3">
              About Us
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-medium tracking-tight text-[#222523] [text-wrap:balance]">
              Thoughtful residential cleaning in {config.city}.
            </h2>
          </div>

          <div className="lg:col-span-7 space-y-5 text-base sm:text-[17px] text-[#3B3F3C] leading-relaxed">
            <p>
              {config.businessName} was founded with a simple mission: to make clean, comfortable
              and welcoming homes accessible to everyone.
            </p>
            <p>
              We believe that every home deserves attention, care and proper cleaning, regardless of
              its size.
            </p>
            <p>
              We are building a reliable cleaning service in {config.serviceAreas.toLowerCase()}{' '}
              that puts customer satisfaction, attention to detail and professionalism first.
            </p>

            <div className="pt-5 border-t border-[#DDD4C3] grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm text-[#525753]">
              <div className="bg-[#FAF8F4] rounded-xl border border-[#DDD4C3] p-4">
                <span className="block font-medium text-[#1B4332] mb-1">
                  Who we serve
                </span>
                <span>
                  Individuals, families, tenants, and homeowners across {config.serviceAreas}.
                </span>
              </div>
              <div className="bg-[#FAF8F4] rounded-xl border border-[#DDD4C3] p-4">
                <span className="block font-medium text-[#1B4332] mb-1">
                  Cleaning products flexibility
                </span>
                <span>
                  Choose whether we bring cleaning supplies and equipment, or use products you
                  provide.
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
