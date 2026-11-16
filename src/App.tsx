import { MessageCircle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { AboutSection } from './components/AboutSection.tsx';
import { BookingSection } from './components/BookingSection.tsx';
import { ContactFooter } from './components/ContactFooter.tsx';
import { Header } from './components/Header.tsx';
import { Hero } from './components/Hero.tsx';
import { OwnerPortalModal } from './components/OwnerPortalModal.tsx';
import { PricingSection } from './components/PricingSection.tsx';
import { ServicesSection } from './components/ServicesSection.tsx';
import { TeamSection } from './components/TeamSection.tsx';
import { WhatsAppFallbackModal } from './components/WhatsAppFallbackModal.tsx';
import { WhyChooseSection } from './components/WhyChooseSection.tsx';
import { isFirebaseConfigured, verifyFirestoreConnection } from './lib/firebase.ts';
import { fetchPublicSiteData } from './lib/firestoreService.ts';
import {
  CLEANING_TYPES,
  DEFAULT_PRICING,
  DEFAULT_SERVICES,
  DEFAULT_SITE_CONFIG,
  HOUSE_TYPES,
} from './shared/defaults.ts';
import type { PricingCategory, ServiceItem, SiteConfig } from './shared/types.ts';
import { buildWhatsAppUrl } from './utils/whatsapp.ts';

type OwnerTab = 'bookings' | 'pricing' | 'contact' | 'services';

export default function App() {
  const [config, setConfig] = useState<SiteConfig>(DEFAULT_SITE_CONFIG);
  const [services, setServices] = useState<ServiceItem[]>(DEFAULT_SERVICES);
  const [pricing, setPricing] = useState<PricingCategory[]>(DEFAULT_PRICING);

  const [selectedHouseType, setSelectedHouseType] = useState<string>(HOUSE_TYPES[0]);
  const [selectedCleaningType, setSelectedCleaningType] = useState<string>(CLEANING_TYPES[0]);

  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  const [ownerModalOpen, setOwnerModalOpen] = useState(false);
  const [ownerTab, setOwnerTab] = useState<OwnerTab>('bookings');

  useEffect(() => {
    if (!isFirebaseConfigured) return;

    let cancelled = false;
    verifyFirestoreConnection().catch(() => false);
    fetchPublicSiteData()
      .then((result) => {
        if (cancelled) return;
        setConfig(result.data.config);
        setServices(result.data.services);
        setPricing(result.data.pricing);
      })
      .catch((error) => {
        console.error('Could not load site configuration from Firestore:', error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const scrollToBooking = useCallback(() => {
    const el = document.getElementById('booking');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handleRequestQuote = useCallback(
    (houseType: string, cleaningType?: string) => {
      setSelectedHouseType(houseType);
      if (cleaningType) {
        setSelectedCleaningType(cleaningType);
      }
      scrollToBooking();
    },
    [scrollToBooking]
  );

  const handleOpenWhatsApp = useCallback(
    (customMessage?: string) => {
      const message =
        customMessage ||
        `Hello ${config.businessName}, I would like to enquire about residential home cleaning services in ${config.city}.`;
      const url = buildWhatsAppUrl(config.whatsappNumber, message);
      if (!url) {
        setWhatsAppModalOpen(true);
        return;
      }
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    [config.whatsappNumber, config.businessName, config.city]
  );

  const handleOpenOwnerPortal = useCallback((initialTab: OwnerTab = 'bookings') => {
    setOwnerTab(initialTab);
    setOwnerModalOpen(true);
  }, []);

  const handleOwnerDataUpdated = useCallback(
    (next: { config?: SiteConfig; pricing?: PricingCategory[]; services?: ServiceItem[] }) => {
      if (next.config) setConfig(next.config);
      if (next.pricing) setPricing(next.pricing);
      if (next.services) setServices(next.services);
    },
    []
  );

  return (
    <div className="min-h-screen bg-[#FAF8F4] text-[#222523] flex flex-col">
      <Header
        logoText={config.logoText}
        businessName={config.businessName}
        onBookClick={scrollToBooking}
      />

      <main className="flex-1">
        <Hero
          config={config}
          onBookClick={scrollToBooking}
          onWhatsAppClick={() => handleOpenWhatsApp()}
        />
        <AboutSection config={config} />
        <ServicesSection
          config={config}
          services={services}
          onRequestQuote={handleRequestQuote}
        />
        <PricingSection
          config={config}
          pricing={pricing}
          onRequestQuote={(houseType) => handleRequestQuote(houseType)}
          onOpenOwnerPricing={() => handleOpenOwnerPortal('pricing')}
        />
        <WhyChooseSection config={config} />
        <TeamSection
          config={config}
          onBookClick={scrollToBooking}
          onWhatsAppInquiry={(msg) => handleOpenWhatsApp(msg)}
        />
        <BookingSection
          config={config}
          selectedHouseType={selectedHouseType}
          selectedCleaningType={selectedCleaningType}
          pricing={pricing}
          onContinueOnWhatsApp={(msg) => handleOpenWhatsApp(msg)}
        />
        <ContactFooter
          config={config}
          onWhatsAppClick={() => handleOpenWhatsApp()}
          onOpenOwnerPortal={handleOpenOwnerPortal}
        />
      </main>

      {/* Site-wide quick WhatsApp booking access */}
      <button
        type="button"
        onClick={() => handleOpenWhatsApp()}
        aria-label={`Chat with ${config.businessName} on WhatsApp`}
        className="fixed bottom-4 right-4 z-30 inline-flex items-center gap-2 px-4 py-3 min-h-[46px] rounded-xl bg-[#1B4332] hover:bg-[#143325] text-white text-sm font-medium shadow-[0_12px_26px_-8px_rgba(27,67,50,0.5)] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4332] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF8F4]"
      >
        <MessageCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
        <span className="hidden sm:inline whitespace-nowrap">Book on WhatsApp</span>
      </button>

      <WhatsAppFallbackModal
        businessName={config.businessName}
        isOpen={whatsAppModalOpen}
        onClose={() => setWhatsAppModalOpen(false)}
        onGoToBooking={scrollToBooking}
        onOpenOwnerContact={() => handleOpenOwnerPortal('contact')}
      />

      <OwnerPortalModal
        isOpen={ownerModalOpen}
        initialTab={ownerTab}
        onClose={() => setOwnerModalOpen(false)}
        config={config}
        pricing={pricing}
        services={services}
        onDataUpdated={handleOwnerDataUpdated}
      />
    </div>
  );
}
