import { motion } from 'motion/react';
import { useState } from 'react';
import type { PricingCategory, SiteConfig } from '../shared/types.ts';
import { ResilientImage } from './ResilientImage.tsx';

export type HomeOccupancyOption = 'occupied' | 'new_unoccupied';

interface PricingSectionProps {
  config: SiteConfig;
  pricing: PricingCategory[];
  onRequestQuote: (houseType: string, occupancy?: HomeOccupancyOption) => void;
}

export interface CleaningPriceRow {
  id: string;
  houseSize: string;
  houseTypeValue: string;
  occupiedPrice: string;
  newHousePrice: string;
  defaultNote: string;
}

export const CLEANING_PRICE_MATRIX: CleaningPriceRow[] = [
  {
    id: 'bedsitter',
    houseSize: 'Bedsitter',
    houseTypeValue: 'Bedsitter',
    occupiedPrice: 'KSh 2,500',
    newHousePrice: 'KSh 1,000–1,500',
    defaultNote: 'Covers main living space, kitchenette, and bathroom',
  },
  {
    id: 'one-bedroom',
    houseSize: '1 Bedroom',
    houseTypeValue: 'One Bedroom',
    occupiedPrice: 'KSh 3,500',
    newHousePrice: 'KSh 2,500',
    defaultNote: 'Covers bedroom, living room, kitchen, and bathroom',
  },
  {
    id: 'two-bedrooms',
    houseSize: '2 Bedrooms',
    houseTypeValue: 'Two Bedrooms',
    occupiedPrice: 'KSh 4,500',
    newHousePrice: 'KSh 3,500',
    defaultNote: 'Covers two bedrooms, lounge/dining, kitchen, and bathrooms',
  },
  {
    id: 'three-bedrooms',
    houseSize: '3 Bedrooms',
    houseTypeValue: 'Three Bedrooms',
    occupiedPrice: 'KSh 6,500',
    newHousePrice: 'KSh 4,500',
    defaultNote: 'Covers three bedrooms, living areas, kitchen, and bathrooms',
  },
  {
    id: 'four-bedrooms-plus',
    houseSize: '4 Bedrooms & Above',
    houseTypeValue: 'Four Bedrooms and Above',
    occupiedPrice: 'KSh 10,000',
    newHousePrice: 'KSh 9,500',
    defaultNote: 'Tailored quotation based on rooms, floors, and requirements',
  },
];

export function PricingSection({ config, pricing, onRequestQuote }: PricingSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<HomeOccupancyOption>('occupied');

  return (
    <section
      id="pricing"
      className="py-14 sm:py-20 bg-[#F4EFE6]/75 border-b border-[#DDD4C3]"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-8">
          <p className="text-xs font-medium tracking-wide text-[#1B4332] mb-2.5">
            Pricing (KES) · Kenyan Shillings
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-medium tracking-tight text-[#222523] [text-wrap:balance] mb-3">
            Clear pricing based on your home&apos;s occupancy.
          </h1>
          <p className="text-sm sm:text-base text-[#525753] leading-relaxed">
            Choose the category that matches whether you are already living in the home or preparing
            a new, unoccupied house before moving in.
          </p>
        </div>

        {/* Two Distinguished Photographic Pricing Category Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          <button
            type="button"
            onClick={() => setSelectedCategory('occupied')}
            aria-pressed={selectedCategory === 'occupied'}
            className={`text-left rounded-2xl border overflow-hidden transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4332] ${
              selectedCategory === 'occupied'
                ? 'bg-[#FAF8F4] border-[#1B4332] shadow-[0_10px_26px_-16px_rgba(27,67,50,0.22)]'
                : 'bg-[#FAF8F4]/70 border-[#DDD4C3] hover:border-[#4F6F58]'
            }`}
          >
            <div className="aspect-[16/8] w-full overflow-hidden bg-[#EFE9DC] border-b border-[#DDD4C3]">
              <ResilientImage
                src="/src/assets/images/service_one_bedroom_1794804173510.jpg"
                alt="Clean furnished occupied living room and bedroom apartment"
                fallbackTitle="Standard Cleaning – Occupied Homes"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3 mb-2">
                <h2 className="font-display text-lg sm:text-xl font-medium text-[#222523]">
                  1. Standard Cleaning – Occupied Homes
                </h2>
                {selectedCategory === 'occupied' && (
                  <span className="text-xs font-semibold text-[#1B4332] whitespace-nowrap shrink-0">
                    Selected
                  </span>
                )}
              </div>
              <p className="text-sm text-[#525753] leading-relaxed">
                Applies when a customer is already living in the house and books{' '}
                {config.businessName} to clean their occupied home.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('new_unoccupied')}
            aria-pressed={selectedCategory === 'new_unoccupied'}
            className={`text-left rounded-2xl border overflow-hidden transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4332] ${
              selectedCategory === 'new_unoccupied'
                ? 'bg-[#FAF8F4] border-[#1B4332] shadow-[0_10px_26px_-16px_rgba(27,67,50,0.22)]'
                : 'bg-[#FAF8F4]/70 border-[#DDD4C3] hover:border-[#4F6F58]'
            }`}
          >
            <div className="aspect-[16/8] w-full overflow-hidden bg-[#EFE9DC] border-b border-[#DDD4C3]">
              <ResilientImage
                src="/src/assets/images/service_move_in_out_1794804175840.jpg"
                alt="Bright newly cleaned empty house before occupation"
                fallbackTitle="New House Cleaning – Before Occupation"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3 mb-2">
                <h2 className="font-display text-lg sm:text-xl font-medium text-[#222523]">
                  2. New House Cleaning – Before Occupation
                </h2>
                {selectedCategory === 'new_unoccupied' && (
                  <span className="text-xs font-semibold text-[#1B4332] whitespace-nowrap shrink-0">
                    Selected
                  </span>
                )}
              </div>
              <p className="text-sm text-[#525753] leading-relaxed">
                Applies when a customer has a new, unoccupied house and wants it cleaned before
                moving in. This is distinct from our separate Move-In / Move-Out Cleaning service.
              </p>
            </div>
          </button>
        </div>

        {/* Indicative Pricing Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="bg-[#FAF8F4] rounded-2xl border border-[#DDD4C3] overflow-hidden shadow-[0_14px_34px_-16px_rgba(27,67,50,0.14)]"
        >
          {/* Desktop Table Header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 border-b border-[#DDD4C3] bg-[#F4EFE6]/60 text-xs font-medium text-[#4A504B]">
            <div className="col-span-4">House Size</div>
            <div
              className={`col-span-3 text-right ${
                selectedCategory === 'occupied' ? 'text-[#1B4332] font-semibold' : ''
              }`}
            >
              Standard Cleaning – Occupied Home
            </div>
            <div
              className={`col-span-3 text-right ${
                selectedCategory === 'new_unoccupied' ? 'text-[#1B4332] font-semibold' : ''
              }`}
            >
              New House – Before Occupation
            </div>
            <div className="col-span-2 text-right">Booking</div>
          </div>

          <div className="divide-y divide-[#DDD4C3]">
            {CLEANING_PRICE_MATRIX.map((row) => {
              const matchedTier = pricing.find(
                (item) => item.houseTypeValue === row.houseTypeValue || item.id === row.id
              );
              const scopeNote = matchedTier?.note?.trim() || row.defaultNote;

              return (
                <div
                  key={row.id}
                  className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 items-center px-5 sm:px-6 py-5 hover:bg-[#F4EFE6]/35 transition-colors"
                >
                  <div className="md:col-span-4">
                    <h3 className="font-display text-lg font-medium text-[#222523]">
                      {row.houseSize}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#525753] mt-0.5 leading-relaxed">
                      {scopeNote}
                    </p>
                  </div>

                  {/* Mobile Two-Category Price Display */}
                  <div className="md:hidden grid grid-cols-2 gap-4 pt-1 pb-1">
                    <div
                      className={`p-3 rounded-xl border ${
                        selectedCategory === 'occupied'
                          ? 'border-[#1B4332]/40 bg-[#DCE6DD]/35'
                          : 'border-[#DDD4C3] bg-white/70'
                      }`}
                    >
                      <span className="block text-[11px] font-medium text-[#525753]">
                        Occupied Home
                      </span>
                      <span className="text-base font-semibold text-[#222523] tabular-nums mt-0.5 block">
                        {row.occupiedPrice}
                      </span>
                    </div>
                    <div
                      className={`p-3 rounded-xl border ${
                        selectedCategory === 'new_unoccupied'
                          ? 'border-[#1B4332]/40 bg-[#DCE6DD]/35'
                          : 'border-[#DDD4C3] bg-white/70'
                      }`}
                    >
                      <span className="block text-[11px] font-medium text-[#525753]">
                        New House (Pre-Occupation)
                      </span>
                      <span className="text-base font-semibold text-[#1B4332] tabular-nums mt-0.5 block">
                        {row.newHousePrice}
                      </span>
                    </div>
                  </div>

                  {/* Desktop Columns */}
                  <div className="hidden md:block md:col-span-3 text-right">
                    <span
                      className={`text-base tabular-nums ${
                        selectedCategory === 'occupied'
                          ? 'font-semibold text-[#1B4332]'
                          : 'font-medium text-[#222523]'
                      }`}
                    >
                      {row.occupiedPrice}
                    </span>
                  </div>

                  <div className="hidden md:block md:col-span-3 text-right">
                    <span
                      className={`text-base tabular-nums ${
                        selectedCategory === 'new_unoccupied'
                          ? 'font-semibold text-[#1B4332]'
                          : 'font-medium text-[#222523]'
                      }`}
                    >
                      {row.newHousePrice}
                    </span>
                  </div>

                  <div className="md:col-span-2 md:text-right pt-1 md:pt-0">
                    <button
                      type="button"
                      onClick={() => onRequestQuote(row.houseTypeValue, selectedCategory)}
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

        <div className="mt-5 rounded-xl border border-[#DDD4C3] bg-[#FAF8F4] px-5 py-4 text-sm text-[#3B3F3C] leading-relaxed">
          <p>
            <strong className="font-semibold text-[#1B4332]">Important pricing note:</strong> All
            prices are indicative in Kenyan Shillings (KES) and may vary depending on house size,
            location and cleaning requirements. Final quotations must be confirmed with the customer
            before accepting a booking.
          </p>
        </div>
      </div>
    </section>
  );
}
