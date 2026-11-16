import { ArrowUpRight } from 'lucide-react';
import { motion } from 'motion/react';
import type { ServiceItem, SiteConfig } from '../shared/types.ts';
import { ResilientImage } from './ResilientImage.tsx';

interface ServicesSectionProps {
  config: SiteConfig;
  services: ServiceItem[];
  onRequestQuote: (houseType: string, cleaningType: string) => void;
}

export function ServicesSection({
  config,
  services,
  onRequestQuote,
}: ServicesSectionProps) {
  return (
    <section id="services" className="py-16 sm:py-22 lg:py-24 border-b border-[#DDD4C3]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <p className="text-xs font-medium tracking-wide text-[#1B4332] mb-3">
              Our Cleaning Services
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-medium tracking-tight text-[#222523] [text-wrap:balance]">
              Tailored care for homes in Roysambu and nearby estates.
            </h2>
          </div>
          <p className="text-sm sm:text-base text-[#525753] max-w-md leading-relaxed">
            Whether you live in a compact bedsitter or a spacious family house, the final price
            depends on house size, current condition, cleaning product option, and your specific
            requirements.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => {
            const orderLabel = String(index + 1).padStart(2, '0');
            return (
              <motion.article
                key={service.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{
                  duration: 0.35,
                  delay: Math.min(index * 0.04, 0.2),
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="group flex flex-col bg-[#FAF8F4] rounded-2xl border border-[#DDD4C3] overflow-hidden shadow-[0_10px_28px_-16px_rgba(27,67,50,0.14)] transition-all duration-200 hover:border-[#1B4332]/45 hover:shadow-[0_18px_36px_-14px_rgba(27,67,50,0.2)]"
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-[#EFE9DC] border-b border-[#DDD4C3]">
                  <ResilientImage
                    src={service.imageUrl}
                    alt={`${service.title} residential cleaning service`}
                    fallbackTitle={service.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <p className="text-xs font-medium text-[#4F6F58] tabular-nums mb-1.5">
                    {orderLabel} <span aria-hidden="true">/</span> Residential Care
                  </p>
                  <h3 className="font-display text-lg font-medium text-[#222523] leading-snug mb-2.5">
                    {service.title}
                  </h3>
                  <p className="text-sm text-[#525753] leading-relaxed mb-5 flex-1">
                    {service.description}
                  </p>

                  <button
                    type="button"
                    onClick={() => onRequestQuote(service.houseTypeValue, service.cleaningTypeValue)}
                    className="inline-flex items-center justify-between w-full px-4 py-2.5 min-h-[44px] text-sm font-medium text-[#1B4332] bg-[#F4EFE6] hover:bg-[#1B4332] hover:text-white rounded-xl border border-[#DDD4C3] hover:border-[#1B4332] transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4332]"
                  >
                    <span>Request a Quote</span>
                    <ArrowUpRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                  </button>
                </div>
              </motion.article>
            );
          })}
        </div>

        {/* Cleaning Products Policy */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="mt-12 rounded-2xl border border-[#DDD4C3] bg-[#F4EFE6]/85 p-6 sm:p-8 shadow-[0_12px_30px_-18px_rgba(27,67,50,0.14)]"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
            <div className="lg:col-span-4">
              <p className="text-xs font-medium tracking-wide text-[#1B4332] mb-2">
                Cleaning Products Policy
              </p>
              <h3 className="font-display text-2xl font-medium text-[#222523] [text-wrap:balance]">
                Two flexible supply options for your clean.
              </h3>
            </div>

            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="bg-[#FAF8F4] rounded-xl border border-[#DDD4C3] p-5">
                <p className="text-xs font-medium text-[#1B4332] mb-1">Option 01</p>
                <h4 className="font-display text-lg font-medium text-[#222523] mb-1.5">
                  We bring products &amp; equipment
                </h4>
                <p className="text-sm text-[#525753] leading-relaxed">
                  {config.businessName} arrives equipped with residential cleaning solutions,
                  microfiber cloths, and essential cleaning tools.
                </p>
              </div>

              <div className="bg-[#FAF8F4] rounded-xl border border-[#DDD4C3] p-5">
                <p className="text-xs font-medium text-[#1B4332] mb-1">Option 02</p>
                <h4 className="font-display text-lg font-medium text-[#222523] mb-1.5">
                  You provide cleaning products
                </h4>
                <p className="text-sm text-[#525753] leading-relaxed">
                  Prefer your own household detergents or fragrances? Our team will clean using the
                  products you provide at home.
                </p>
              </div>

              <p className="sm:col-span-2 text-xs sm:text-sm text-[#525753] leading-relaxed pt-1">
                {config.productsPolicyNote}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
