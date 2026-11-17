import { ExternalLink, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { useRef, type MouseEvent } from 'react';
import type { SiteConfig } from '../shared/types.ts';
import { BrandMark } from './BrandMark.tsx';

interface ContactSectionProps {
  config: SiteConfig;
  onWhatsAppClick: () => void;
}

export function ContactSection({ config, onWhatsAppClick }: ContactSectionProps) {
  const socialEntries = [
    { key: 'instagram', label: 'Instagram', url: config.socialLinks.instagram },
    { key: 'facebook', label: 'Facebook', url: config.socialLinks.facebook },
    { key: 'tiktok', label: 'TikTok', url: config.socialLinks.tiktok },
    { key: 'x', label: 'X', url: config.socialLinks.x },
  ] as const;

  const configuredSocials = socialEntries.filter((entry) => Boolean(entry.url));

  return (
    <section
      id="contact"
      className="py-16 sm:py-22 lg:py-24 bg-[#F4EFE6]/75 border-b border-[#DDD4C3]"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          <div className="lg:col-span-5">
            <p className="text-xs font-medium tracking-wide text-[#1B4332] mb-3">
              Contact Us
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-medium tracking-tight text-[#222523] [text-wrap:balance] mb-4">
              Ready for a cleaner home? Let&apos;s talk.
            </h2>
            <p className="text-base text-[#525753] leading-relaxed mb-7">
              Reach out to {config.businessName} on WhatsApp, by phone, or via email for quotes
              and home cleaning bookings across {config.serviceAreas.toLowerCase()}.
            </p>

            <button
              type="button"
              onClick={onWhatsAppClick}
              className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 min-h-[48px] text-sm sm:text-base font-medium text-white bg-[#1B4332] hover:bg-[#143325] rounded-xl shadow-[0_10px_24px_-8px_rgba(27,67,50,0.45)] transition-all whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4332]"
            >
              <MessageCircle className="w-4 h-4" aria-hidden="true" />
              <span>Book on WhatsApp</span>
            </button>
          </div>

          <div className="lg:col-span-7 bg-[#FAF8F4] rounded-2xl border border-[#DDD4C3] divide-y divide-[#DDD4C3] shadow-[0_14px_34px_-18px_rgba(27,67,50,0.14)]">
            <div className="p-6 flex items-start gap-4">
              <MapPin className="w-5 h-5 text-[#1B4332] shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <h3 className="text-sm font-medium text-[#222523]">Service Location</h3>
                <p className="text-sm text-[#525753] mt-1">
                  {config.city} — {config.serviceAreas}
                </p>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex items-start gap-3.5">
                <Phone className="w-5 h-5 text-[#1B4332] shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <h3 className="text-sm font-medium text-[#222523]">Phone &amp; WhatsApp</h3>
                  {config.telephone ? (
                    <a
                      href={`tel:${config.telephone.replace(/\s+/g, '')}`}
                      className="text-sm text-[#222523] hover:text-[#1B4332] underline-offset-4 hover:underline mt-1 inline-block tabular-nums"
                    >
                      {config.telephone}
                    </a>
                  ) : (
                    <p className="text-sm text-[#525753] mt-1">Available upon enquiry</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <Mail className="w-5 h-5 text-[#1B4332] shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <h3 className="text-sm font-medium text-[#222523]">Email</h3>
                  {config.email ? (
                    <a
                      href={`mailto:${config.email}`}
                      className="text-sm text-[#222523] hover:text-[#1B4332] underline-offset-4 hover:underline mt-1 inline-block break-all"
                    >
                      {config.email}
                    </a>
                  ) : (
                    <p className="text-sm text-[#525753] mt-1">Available upon enquiry</p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6">
              <h3 className="text-sm font-medium text-[#222523]">Social Media</h3>
              {configuredSocials.length > 0 ? (
                <div className="flex flex-wrap items-center gap-4 mt-2">
                  {configuredSocials.map((social) => (
                    <a
                      key={social.key}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1B4332] hover:text-[#4F6F58] underline-offset-4 hover:underline"
                    >
                      <span>{social.label}</span>
                      <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#525753] mt-1">
                  Connect with {config.businessName} via phone, email, or WhatsApp.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

interface SiteFooterProps {
  config: SiteConfig;
  onNavigate: (path: string) => void;
  onNavigateHomeSection: (sectionId?: string) => void;
  onOwnerTrigger?: () => void;
}

export function SiteFooter({
  config,
  onNavigate,
  onNavigateHomeSection,
  onOwnerTrigger,
}: SiteFooterProps) {
  const tapStateRef = useRef<{ count: number; lastTapAt: number }>({
    count: 0,
    lastTapAt: 0,
  });

  const handleFooterBrandTap = () => {
    if (!onOwnerTrigger) return;
    const now = Date.now();
    if (now - tapStateRef.current.lastTapAt > 2500) {
      tapStateRef.current.count = 1;
    } else {
      tapStateRef.current.count += 1;
    }
    tapStateRef.current.lastTapAt = now;

    if (tapStateRef.current.count >= 5) {
      tapStateRef.current.count = 0;
      tapStateRef.current.lastTapAt = 0;
      onOwnerTrigger();
    }
  };

  const handleSectionLink = (e: MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    onNavigateHomeSection(sectionId);
  };

  const handleLegalLink = (e: MouseEvent<HTMLAnchorElement>, path: string) => {
    e.preventDefault();
    onNavigate(path);
  };

  return (
    <footer className="bg-[#FAF8F4] py-10 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4 sm:gap-5">
          <div onClick={handleFooterBrandTap} className="select-none touch-manipulation">
            <BrandMark variant="footer" logoText={config.logoText} />
          </div>
          <div>
            <p className="font-display text-base sm:text-lg font-semibold text-[#1B4332]">
              {config.businessName}
            </p>
            <p className="text-sm text-[#525753] mt-0.5">{config.tagline}</p>
            <p className="text-xs text-[#4F6F58] mt-1">{config.city}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2.5 text-sm text-[#525753]">
          <a
            href="/#about"
            onClick={(e) => handleSectionLink(e, 'about')}
            className="hover:text-[#1B4332] transition-colors"
          >
            About
          </a>
          <a
            href="/#services"
            onClick={(e) => handleSectionLink(e, 'services')}
            className="hover:text-[#1B4332] transition-colors"
          >
            Services
          </a>
          <a
            href="/#pricing"
            onClick={(e) => handleSectionLink(e, 'pricing')}
            className="hover:text-[#1B4332] transition-colors"
          >
            Pricing
          </a>
          <a
            href="/#booking"
            onClick={(e) => handleSectionLink(e, 'booking')}
            className="hover:text-[#1B4332] transition-colors"
          >
            Book
          </a>
          <a
            href="/#contact"
            onClick={(e) => handleSectionLink(e, 'contact')}
            className="hover:text-[#1B4332] transition-colors"
          >
            Contact
          </a>
          <a
            href="/#recruitment"
            onClick={(e) => handleSectionLink(e, 'recruitment')}
            className="hover:text-[#1B4332] transition-colors"
          >
            Recruitment
          </a>
          <a
            href="/#team"
            onClick={(e) => handleSectionLink(e, 'team')}
            className="hover:text-[#1B4332] transition-colors"
          >
            Founder
          </a>
          <a
            href="/privacy-policy"
            onClick={(e) => handleLegalLink(e, '/privacy-policy')}
            className="text-[#1B4332] hover:text-[#4F6F58] font-medium transition-colors"
          >
            Privacy Policy
          </a>
          <a
            href="/terms-of-use"
            onClick={(e) => handleLegalLink(e, '/terms-of-use')}
            className="text-[#1B4332] hover:text-[#4F6F58] font-medium transition-colors"
          >
            Terms of Use
          </a>
        </div>
      </div>
    </footer>
  );
}

interface ContactFooterProps {
  config: SiteConfig;
  onWhatsAppClick: () => void;
  onNavigate: (path: string) => void;
  onNavigateHomeSection: (sectionId?: string) => void;
  onOwnerTrigger?: () => void;
}

export function ContactFooter({
  config,
  onWhatsAppClick,
  onNavigate,
  onNavigateHomeSection,
  onOwnerTrigger,
}: ContactFooterProps) {
  return (
    <>
      <ContactSection config={config} onWhatsAppClick={onWhatsAppClick} />
      <SiteFooter
        config={config}
        onNavigate={onNavigate}
        onNavigateHomeSection={onNavigateHomeSection}
        onOwnerTrigger={onOwnerTrigger}
      />
    </>
  );
}
