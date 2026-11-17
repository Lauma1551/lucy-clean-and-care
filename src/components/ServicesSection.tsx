import { ArrowUpRight } from 'lucide-react';
import { motion } from 'motion/react';
import type { ServiceItem, SiteConfig } from '../shared/types.ts';
import { ResilientImage } from './ResilientImage.tsx';

interface ServicesSectionProps {
  config: SiteConfig;
  services: ServiceItem[];
  onRequestQuote: (houseType: string, cleaningType: string) => void;
}

interface FeaturedServiceCard {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
  houseTypeValue: string;
  cleaningTypeValue: string;
  tasks: readonly string[];
}

const FEATURED_SERVICES: readonly FeaturedServiceCard[] = [
  {
    id: 'regular-home-cleaning',
    title: 'Regular Home Cleaning',
    description: 'Routine cleaning to keep occupied homes fresh, tidy and comfortable.',
    imageUrl: '/src/assets/images/about_floor_mop_1794945013223.jpg',
    imageAlt: 'Mopping a residential living room floor during a regular home clean',
    houseTypeValue: 'One Bedroom',
    cleaningTypeValue: 'Standard Home Cleaning',
    tasks: [
      'Dusting and wiping surfaces',
      'Sweeping and mopping floors',
      'Cleaning kitchen surfaces',
      'Bathroom cleaning',
    ],
  },
  {
    id: 'deep-cleaning',
    title: 'Deep Cleaning',
    description: 'A more thorough cleaning service for areas that need additional attention.',
    imageUrl: '/src/assets/images/about_kitchen_clean_1794945012510.jpg',
    imageAlt: 'Detailed deep cleaning of a residential kitchen countertop and sink',
    houseTypeValue: 'Two Bedrooms',
    cleaningTypeValue: 'Deep Cleaning',
    tasks: [
      'Detailed kitchen cleaning',
      'Thorough bathroom cleaning',
      'Cleaning corners and hard-to-reach areas',
      'Detailed surface and floor cleaning',
    ],
  },
  {
    id: 'kitchen-bathroom-cleaning',
    title: 'Kitchen and Bathroom Cleaning',
    description:
      'Focused degreasing and sanitising for kitchen counters, sinks, tiles, and washrooms.',
    imageUrl: '/src/assets/images/about_sink_clean_1794945012422.jpg',
    imageAlt: 'Polishing and sanitising a residential bathroom sink and tap',
    houseTypeValue: 'One Bedroom',
    cleaningTypeValue: 'Kitchen and Bathroom Cleaning',
    tasks: [
      'Wiping counters, hobs, and splashbacks',
      'Cleaning kitchen and bathroom sinks',
      'Scrubbing bathroom tiles and showers',
      'Sanitising taps and sanitary fixtures',
    ],
  },
  {
    id: 'move-in-out-cleaning',
    title: 'Move-In / Move-Out Cleaning',
    description: 'Cleaning a home when preparing to move in or leave a property.',
    imageUrl: '/src/assets/images/service_move_in_out_1794804175840.jpg',
    imageAlt: 'Clean empty apartment prepared for move-in or move-out handover',
    houseTypeValue: 'Two Bedrooms',
    cleaningTypeValue: 'Move-In and Move-Out Cleaning',
    tasks: [
      'Cleaning empty rooms',
      'Kitchen and bathroom cleaning',
      'Wiping cupboards and surfaces',
      'Floor cleaning',
    ],
  },
];

export function ServicesSection({
  config,
  services,
  onRequestQuote,
}: ServicesSectionProps) {
  const activeServices = FEATURED_SERVICES.filter((card) => {
    const matchingItems = services.filter(
      (item) => item.cleaningTypeValue === card.cleaningTypeValue
    );
    if (matchingItems.length === 0) return true;
    return matchingItems.some((item) => item.available !== false);
  });

  return (
    <section id="services" className="py-14 sm:py-20 border-b border-[#DDD4C3]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-10 sm:mb-12">
          <p className="text-xs font-medium tracking-wide text-[#1B4332] mb-2.5">
            Services
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-medium tracking-tight text-[#222523] [text-wrap:balance] mb-3">
            Home cleaning tailored to your space.
          </h1>
          <p className="text-sm sm:text-base text-[#525753] leading-relaxed">
            Clear residential cleaning services across {config.serviceAreas.toLowerCase()}, from
            bedsitter apartments to multi-bedroom homes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-7 lg:gap-8">
          {activeServices.map((service, index) => (
            <motion.article
              key={service.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{
                duration: 0.35,
                delay: Math.min(index * 0.05, 0.2),
                ease: [0.16, 1, 0.3, 1],
              }}
              className="group flex flex-col bg-[#FAF8F4] rounded-2xl border border-[#DDD4C3] overflow-hidden shadow-[0_12px_30px_-18px_rgba(27,67,50,0.14)]"
            >
              <div className="aspect-[16/10] w-full overflow-hidden bg-[#EFE9DC] border-b border-[#DDD4C3]">
                <ResilientImage
                  src={service.imageUrl}
                  alt={service.imageAlt}
                  fallbackTitle={service.title}
                  className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </div>

              <div className="p-6 flex-1 flex flex-col">
                <h2 className="font-display text-2xl font-medium text-[#222523] leading-snug mb-2">
                  {service.title}
                </h2>
                <p className="text-sm sm:text-[15px] text-[#525753] leading-relaxed mb-4">
                  {service.description}
                </p>

                <ul className="space-y-1.5 text-sm text-[#3B3F3C] mb-6 flex-1 list-disc pl-5 marker:text-[#1B4332]">
                  {service.tasks.map((task) => (
                    <li key={task}>{task}</li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => onRequestQuote(service.houseTypeValue, service.cleaningTypeValue)}
                  className="inline-flex items-center justify-between w-full px-5 py-3 min-h-[44px] text-sm font-medium text-white bg-[#1B4332] hover:bg-[#143325] rounded-xl transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4332]"
                >
                  <span>Book This Service</span>
                  <ArrowUpRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                </button>
              </div>
            </motion.article>
          ))}
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
