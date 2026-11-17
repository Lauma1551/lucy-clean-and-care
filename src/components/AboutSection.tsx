import { motion } from 'motion/react';
import type { SiteConfig } from '../shared/types.ts';
import { ResilientImage } from './ResilientImage.tsx';

interface AboutSectionProps {
  config?: SiteConfig;
}

const ABOUT_SHOWCASE_PHOTOS = [
  {
    src: '/src/assets/images/about_kitchen_clean_1794945012510.jpg',
    alt: 'Cleaning a kitchen countertop and stainless steel sink',
    caption: 'Kitchen cleaning',
  },
  {
    src: '/src/assets/images/about_sink_clean_1794945012422.jpg',
    alt: 'Cleaning a porcelain bathroom sink and chrome tap',
    caption: 'Bathroom sink cleaning',
  },
  {
    src: '/src/assets/images/about_floor_mop_1794945013223.jpg',
    alt: 'Mopping a home floor using a mop and bucket',
    caption: 'Floor mopping with a bucket',
  },
] as const;

export function AboutSection({ config }: AboutSectionProps) {
  const businessName = config?.businessName || 'Lucy Clean & Care';

  return (
    <section
      id="about"
      className="py-14 sm:py-20 bg-[#F4EFE6]/75 border-b border-[#DDD4C3]"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl mx-auto text-center mb-12 sm:mb-14"
        >
          <h1 className="text-xs font-medium tracking-wide text-[#1B4332] mb-3">
            About Us
          </h1>
          <p className="font-display text-3xl sm:text-4xl font-medium tracking-tight text-[#222523] [text-wrap:balance] leading-[1.2]">
            Thoughtful home cleaning for a fresher, happier home.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {ABOUT_SHOWCASE_PHOTOS.map((photo, index) => (
            <motion.figure
              key={photo.src}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{
                duration: 0.35,
                delay: index * 0.06,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="flex flex-col"
            >
              <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl border border-[#DDD4C3] bg-[#E7E0D3] shadow-[0_12px_30px_-18px_rgba(27,67,50,0.16)]">
                <ResilientImage
                  src={photo.src}
                  alt={`${businessName} — ${photo.alt}`}
                  fallbackTitle={photo.caption}
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <figcaption className="mt-3 text-sm font-medium text-[#3B3F3C] text-center sm:text-left">
                {photo.caption}
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
