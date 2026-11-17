import { ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import type { SiteConfig } from '../shared/types.ts';
import { ResilientImage } from './ResilientImage.tsx';

interface HomePageOverviewProps {
  config: SiteConfig;
  onNavigate: (path: string) => void;
  onBookService: (houseType: string, cleaningType: string) => void;
}

const HOME_SERVICES_PREVIEW = [
  {
    id: 'regular',
    title: 'Regular Home Cleaning',
    summary: 'Routine surface dusting, sweeping, mopping, kitchen and bathroom care.',
    imageUrl: '/src/assets/images/about_floor_mop_1794945013223.jpg',
    imageAlt: 'Mopping a residential floor with a mop and bucket',
    houseType: 'One Bedroom',
    cleaningType: 'Standard Home Cleaning',
  },
  {
    id: 'deep',
    title: 'Deep Cleaning',
    summary: 'Thorough attention for kitchens, bathrooms, corners and hard-to-reach spots.',
    imageUrl: '/src/assets/images/about_kitchen_clean_1794945012510.jpg',
    imageAlt: 'Detailed wiping and cleaning of a modern kitchen sink and counter',
    houseType: 'Two Bedrooms',
    cleaningType: 'Deep Cleaning',
  },
  {
    id: 'move-in-out',
    title: 'Move-In / Move-Out Cleaning',
    summary: 'Full empty-room, cupboard, kitchen and floor preparation before handover.',
    imageUrl: '/src/assets/images/service_move_in_out_1794804175840.jpg',
    imageAlt: 'Freshly cleaned empty apartment ready for move-in',
    houseType: 'Two Bedrooms',
    cleaningType: 'Move-In and Move-Out Cleaning',
  },
] as const;

export function HomePageOverview({
  config,
  onNavigate,
  onBookService,
}: HomePageOverviewProps) {
  return (
    <>
      {/* Visual Services Introduction */}
      <section className="py-14 sm:py-20 bg-[#FAF8F4] border-b border-[#DDD4C3]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div className="max-w-xl">
              <p className="text-xs font-medium tracking-wide text-[#1B4332] mb-2">
                Our Cleaning Services
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-medium tracking-tight text-[#222523] [text-wrap:balance]">
                Carefully cleaned rooms across every home size.
              </h2>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('/services')}
              className="inline-flex items-center gap-2 text-sm font-medium text-[#1B4332] hover:text-[#143325] underline-offset-4 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>View all services</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {HOME_SERVICES_PREVIEW.map((item, idx) => (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{
                  duration: 0.35,
                  delay: idx * 0.05,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="flex flex-col bg-[#F4EFE6]/60 rounded-2xl border border-[#DDD4C3] overflow-hidden"
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-[#E7E0D3] border-b border-[#DDD4C3]">
                  <ResilientImage
                    src={item.imageUrl}
                    alt={item.imageAlt}
                    fallbackTitle={item.title}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-display text-xl font-medium text-[#222523] mb-1.5">
                    {item.title}
                  </h3>
                  <p className="text-sm text-[#525753] leading-relaxed mb-4 flex-1">
                    {item.summary}
                  </p>
                  <button
                    type="button"
                    onClick={() => onBookService(item.houseType, item.cleaningType)}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1B4332] hover:text-[#143325] underline-offset-4 hover:underline cursor-pointer self-start"
                  >
                    <span>Book this service</span>
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* Photographic Home Care & Transparent Pricing Invitation */}
      <section className="py-14 sm:py-20 bg-[#F4EFE6]/75 border-b border-[#DDD4C3]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-7 grid grid-cols-2 gap-4">
              <div className="aspect-[4/3] overflow-hidden rounded-2xl border border-[#DDD4C3] bg-[#E7E0D3]">
                <ResilientImage
                  src="/src/assets/images/about_sink_clean_1794945012422.jpg"
                  alt="Cleaning a bright bathroom sink and faucet"
                  fallbackTitle="Bathroom sink cleaning"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div className="aspect-[4/3] overflow-hidden rounded-2xl border border-[#DDD4C3] bg-[#E7E0D3]">
                <ResilientImage
                  src="/src/assets/images/hero_modern_home_1794804172824.jpg"
                  alt="Freshly cleaned bright living room"
                  fallbackTitle={config.businessName}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="lg:col-span-5">
              <p className="text-xs font-medium tracking-wide text-[#1B4332] mb-2">
                {config.city}
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-medium tracking-tight text-[#222523] [text-wrap:balance] mb-3">
                Clear KES rates and flexible scheduling.
              </h2>
              <p className="text-sm sm:text-base text-[#525753] leading-relaxed mb-6">
                View indicative pricing for occupied and new unoccupied homes, or submit your
                booking request online in minutes.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => onNavigate('/book')}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] text-sm font-medium text-white bg-[#1B4332] hover:bg-[#143325] rounded-xl shadow-[0_8px_20px_-8px_rgba(27,67,50,0.45)] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Book a Cleaning</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('/pricing')}
                  className="inline-flex items-center justify-center px-5 py-3 min-h-[44px] text-sm font-medium text-[#1B4332] bg-[#FAF8F4] hover:bg-[#E9E2D4] border border-[#DDD4C3] rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  View Pricing
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
