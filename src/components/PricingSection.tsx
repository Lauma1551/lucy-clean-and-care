import { Pencil } from 'lucide-react';
import { motion } from 'motion/react';
import type { PricingCategory, SiteConfig } from '../shared/types.ts';
import { formatKesPrice } from '../utils/whatsapp.ts';

interface PricingSectionProps {
  config: SiteConfig;
  pricing: PricingCategory[];
  onRequestQuote: (houseType: string) => void;
  onOpenOwnerPricing: () => void;
}

export function PricingSection({
  config,
  pricing,
  onRequestQuote,
  onOpenOwnerPricing,
}: PricingSectionProps) {
  return (
    <section
      id="pricing"
      className="py-16 sm:py-22 lg:py-24 bg-[#F4EFE6]/75 border-b border-[#DDD4C3]"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="max-w-2xl">
            <p className="text-xs font-medium tracking-wide text-[#1B4332] mb-3">
              Service Price List · Kenyan Shillings (KES)
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-medium tracking-tight text-[#222523] [text-wrap:balance]">
              Transparent quotations tailored to your home.
            </h2>
          </div>

          <button
            type="button"
            onClick={onOpenOwnerPricing}
            className="inline-flex items-center gap-2 self-start md:self-auto px-4 py-2.5 min-h-[42px] text-xs sm:text-sm font-medium text-[#1B4332] hover:text-white bg-[#FAF8F4] hover:bg-[#1B4332] border border-[#DDD4C3] hover:border-[#1B4332] rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4332]"
          >
            <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Owner: Edit KES Prices</span>
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="bg-[#FAF8F4] rounded-2xl border border-[#DDD4C3] overflow-hidden shadow-[0_14px_34px_-16px_rgba(27,67,50,0.14)]"
        >
          <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-4 border-b border-[#DDD4C3] bg-[#F4EFE6]/50 text-xs font-medium text-[#4A504B]">
            <div className="col-span-4">Home Category</div>
            <div className="col-span-4">Scope Summary</div>
            <div className="col-span-2 text-right">Rate (KES)</div>
            <div className="col-span-2 text-right">Action</div>
          </div>

          <div className="divide-y divide-[#DDD4C3]">
            {pricing.map((tier) => {
              const formattedPrice = formatKesPrice(tier.priceKes);
              const isQuoteOnly = tier.priceKes === null;

              return (
                <div
                  key={tier.id}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-center px-5 sm:px-6 py-5 hover:bg-[#F4EFE6]/35 transition-colors"
                >
                  <div className="sm:col-span-4">
                    <h3 className="font-display text-lg font-medium text-[#222523]">
                      {tier.label}
                    </h3>
                  </div>

                  <div className="sm:col-span-4 text-sm text-[#525753] leading-relaxed">
                    {tier.note}
                  </div>

                  <div className="sm:col-span-2 sm:text-right">
                    <span
                      className={`text-base font-semibold tabular-nums ${
                        isQuoteOnly ? 'text-[#1B4332]' : 'text-[#222523]'
                      }`}
                    >
                      {formattedPrice}
                    </span>
                  </div>

                  <div className="sm:col-span-2 sm:text-right pt-1 sm:pt-0">
                    <button
                      type="button"
                      onClick={() => onRequestQuote(tier.houseTypeValue)}
                      className="inline-flex items-center justify-center px-4 py-2 min-h-[40px] text-sm font-medium text-white bg-[#1B4332] hover:bg-[#143325] rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4332]"
                    >
                      Request a Quote
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        <p className="mt-5 text-sm text-[#525753] leading-relaxed">
          Final quotes are confirmed after reviewing your home size, current condition, cleaning
          type (standard, deep, kitchen/bathroom, or move-in/move-out), and whether{' '}
          {config.businessName} brings the cleaning products and equipment or you provide your own.
          {pricing[0]?.updatedAt && (
            <span className="block mt-1.5 text-xs text-[#4F6F58]">
              Price list last updated:{' '}
              {new Date(pricing[0].updatedAt).toLocaleDateString('en-KE', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          )}
        </p>
      </div>
    </section>
  );
}
