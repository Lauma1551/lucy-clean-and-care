import { motion } from 'motion/react';
import type { SiteConfig } from '../shared/types.ts';

interface WhyChooseSectionProps {
  config: SiteConfig;
}

const PILLARS = [
  {
    number: '01',
    title: 'Attention to detail',
    description:
      'From skirting boards and light switches to kitchen counters and corners, every room receives careful, unhurried cleaning.',
  },
  {
    number: '02',
    title: 'Convenient home cleaning',
    description:
      'Choose a date, time window, and cleaning product option that fits your household routine.',
  },
  {
    number: '03',
    title: 'Friendly customer service',
    description:
      'Clear, courteous communication from your first message on WhatsApp or our booking form to the final walk-through.',
  },
  {
    number: '04',
    title: 'Transparent quotations',
    description:
      'No hidden surprises—every quotation in Kenyan Shillings is discussed upfront based on your home size, condition, and product preference.',
  },
  {
    number: '05',
    title: "Care for customers' homes",
    description:
      'We treat your furniture, surfaces, and personal belongings with respect, privacy, and gentle handling.',
  },
  {
    number: '06',
    title: 'Commitment to customer satisfaction',
    description:
      'Your comfort comes first. If anything in your home needs extra attention before we finish, let us know right away.',
  },
] as const;

export function WhyChooseSection({ config }: WhyChooseSectionProps) {
  return (
    <section className="py-16 sm:py-22 lg:py-24 border-b border-[#DDD4C3]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-12">
          <p className="text-xs font-medium tracking-wide text-[#1B4332] mb-3">
            Why Choose {config.businessName}?
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-medium tracking-tight text-[#222523] [text-wrap:balance]">
            Built around trust, care, and consistency.
          </h2>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-t border-l border-[#DDD4C3] rounded-2xl overflow-hidden bg-[#FAF8F4] shadow-[0_12px_30px_-18px_rgba(27,67,50,0.12)]"
        >
          {PILLARS.map((pillar) => (
            <div
              key={pillar.number}
              className="p-7 sm:p-8 border-r border-b border-[#DDD4C3] flex flex-col justify-between hover:bg-[#F4EFE6]/45 transition-colors"
            >
              <div>
                <span className="block text-xs font-semibold text-[#1B4332] tabular-nums mb-3">
                  {pillar.number}
                </span>
                <h3 className="font-display text-xl font-medium text-[#222523] mb-2.5">
                  {pillar.title}
                </h3>
                <p className="text-sm sm:text-[15px] text-[#525753] leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
