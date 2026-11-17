import { MessageCircle } from 'lucide-react';
import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { AboutSection } from './components/AboutSection.tsx';
import { BookingSection } from './components/BookingSection.tsx';
import { ContactSection, SiteFooter } from './components/ContactFooter.tsx';
import { Header } from './components/Header.tsx';
import { Hero } from './components/Hero.tsx';
import { HomePageOverview } from './components/HomePageOverview.tsx';
import { PrivacyPolicyPage, TermsOfUsePage } from './components/LegalPages.tsx';
import { PricingSection, type HomeOccupancyOption } from './components/PricingSection.tsx';

const OwnerPortalModal = lazy(() =>
  import('./components/OwnerPortalModal.tsx').then((m) => ({ default: m.OwnerPortalModal }))
);
import { ServicesSection } from './components/ServicesSection.tsx';
import { FounderSection, FutureRecruitmentSection } from './components/TeamSection.tsx';
import { WhatsAppFallbackModal } from './components/WhatsAppFallbackModal.tsx';
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

function normalizePath(rawPath: string): string {
  const pathOnly = rawPath.split('#')[0]?.split('?')[0] ?? '/';
  const cleaned = pathOnly.replace(/\/+$/, '');
  if (cleaned === '/recruitment') return '/contact';
  return cleaned === '' ? '/' : cleaned;
}

function getPageTitle(pathname: string, businessName: string, tagline: string): string {
  switch (pathname) {
    case '/about':
      return `About Us | ${businessName}`;
    case '/services':
      return `Services | ${businessName}`;
    case '/pricing':
      return `Pricing | ${businessName}`;
    case '/contact':
      return `Contact | ${businessName}`;
    case '/founder':
      return `Founder | ${businessName}`;
    case '/book':
      return `Book a Cleaning | ${businessName}`;
    case '/privacy-policy':
      return `Privacy Policy | ${businessName}`;
    case '/terms-of-use':
      return `Terms of Use | ${businessName}`;
    case '/owner':
    case '/owner-portal':
      return `Owner Access | ${businessName}`;
    default:
      return `${businessName} | ${tagline}`;
  }
}

export default function App() {
  const [pathname, setPathname] = useState<string>(() =>
    typeof window !== 'undefined' ? normalizePath(window.location.pathname) : '/'
  );
  const [config, setConfig] = useState<SiteConfig>(DEFAULT_SITE_CONFIG);
  const [services, setServices] = useState<ServiceItem[]>(DEFAULT_SERVICES);
  const [pricing, setPricing] = useState<PricingCategory[]>(DEFAULT_PRICING);

  const [selectedHouseType, setSelectedHouseType] = useState<string>(HOUSE_TYPES[0]);
  const [selectedCleaningType, setSelectedCleaningType] = useState<string>(CLEANING_TYPES[0]);
  const [selectedOccupancy, setSelectedOccupancy] = useState<HomeOccupancyOption>('occupied');

  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  const [ownerEntryOpen, setOwnerEntryOpen] = useState(false);

  const isOwnerRoute = pathname === '/owner' || pathname === '/owner-portal';

  const scrollToHashTarget = useCallback((hashId: string) => {
    window.requestAnimationFrame(() => {
      window.setTimeout(() => {
        document.getElementById(hashId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
    });
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const nextPath = normalizePath(window.location.pathname);
      setPathname(nextPath);
      const hash = window.location.hash.replace(/^#/, '');
      if (hash) {
        scrollToHashTarget(hash);
      } else {
        window.scrollTo({ top: 0, behavior: 'auto' });
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [scrollToHashTarget]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash.replace(/^#/, '');
    if (hash) {
      scrollToHashTarget(hash);
    }
  }, [pathname, scrollToHashTarget]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isOwnerShortcut =
        e.shiftKey &&
        (e.ctrlKey || e.metaKey || e.altKey) &&
        e.key.toLowerCase() === 'l';
      if (isOwnerShortcut) {
        e.preventDefault();
        setOwnerEntryOpen(true);
      } else if (e.key === 'Escape' && ownerEntryOpen) {
        setOwnerEntryOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [ownerEntryOpen]);

  useEffect(() => {
    document.title = getPageTitle(pathname, config.businessName, config.tagline);
  }, [pathname, config.businessName, config.tagline]);

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

  const navigate = useCallback(
    (toPath: string) => {
      const [, rawHash = ''] = toPath.split('#');
      const normalized = normalizePath(toPath);
      const targetUrl = rawHash ? `${normalized}#${rawHash}` : normalized;
      const currentFull = `${normalizePath(window.location.pathname)}${window.location.hash}`;

      if (currentFull !== targetUrl) {
        window.history.pushState({}, '', targetUrl);
      }

      setPathname(normalized);

      if (rawHash) {
        scrollToHashTarget(rawHash);
      } else {
        window.scrollTo({ top: 0, behavior: 'auto' });
      }
    },
    [scrollToHashTarget]
  );

  const goToBooking = useCallback(() => {
    navigate('/book');
  }, [navigate]);

  const handleRequestQuote = useCallback(
    (houseType: string, cleaningType?: string, occupancy?: HomeOccupancyOption) => {
      setSelectedHouseType(houseType);
      if (cleaningType) {
        setSelectedCleaningType(cleaningType);
      }
      if (occupancy) {
        setSelectedOccupancy(occupancy);
      }
      navigate('/book');
    },
    [navigate]
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

  const handleOwnerDataUpdated = useCallback(
    (next: { config?: SiteConfig; pricing?: PricingCategory[]; services?: ServiceItem[] }) => {
      if (next.config) setConfig(next.config);
      if (next.pricing) setPricing(next.pricing);
      if (next.services) setServices(next.services);
    },
    []
  );

  if (isOwnerRoute) {
    return (
      <div className="min-h-screen bg-[#FAF8F4] text-[#222523]">
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center text-sm text-[#525753]">
              Verifying access...
            </div>
          }
        >
          <OwnerPortalModal
            isOpen={true}
            initialTab="bookings"
            onClose={() => navigate('/')}
            config={config}
            pricing={pricing}
            services={services}
            onDataUpdated={handleOwnerDataUpdated}
          />
        </Suspense>
      </div>
    );
  }

  const renderPage = () => {
    switch (pathname) {
      case '/about':
        return <AboutSection config={config} />;

      case '/services':
        return (
          <ServicesSection
            config={config}
            services={services}
            onRequestQuote={(houseType, cleaningType) =>
              handleRequestQuote(houseType, cleaningType)
            }
          />
        );

      case '/pricing':
        return (
          <PricingSection
            config={config}
            pricing={pricing}
            onRequestQuote={(houseType, occupancy) =>
              handleRequestQuote(houseType, undefined, occupancy)
            }
          />
        );

      case '/contact':
        return (
          <>
            <ContactSection
              config={config}
              onWhatsAppClick={() => handleOpenWhatsApp()}
              onBookClick={goToBooking}
            />
            <FutureRecruitmentSection
              config={config}
              onWhatsAppInquiry={(msg) => handleOpenWhatsApp(msg)}
            />
          </>
        );

      case '/founder':
        return <FounderSection config={config} onBookClick={goToBooking} />;

      case '/book':
        return (
          <BookingSection
            config={config}
            selectedHouseType={selectedHouseType}
            selectedCleaningType={selectedCleaningType}
            selectedOccupancy={selectedOccupancy}
            pricing={pricing}
            onContinueOnWhatsApp={(msg) => handleOpenWhatsApp(msg)}
          />
        );

      case '/privacy-policy':
        return (
          <>
            <PrivacyPolicyPage
              config={config}
              onBackHome={() => navigate('/')}
              onNavigate={navigate}
              onWhatsAppClick={() => handleOpenWhatsApp()}
            />
            <ContactSection
              config={config}
              onWhatsAppClick={() => handleOpenWhatsApp()}
              onBookClick={goToBooking}
            />
          </>
        );

      case '/terms-of-use':
        return (
          <>
            <TermsOfUsePage
              config={config}
              onBackHome={() => navigate('/')}
              onNavigate={navigate}
              onWhatsAppClick={() => handleOpenWhatsApp()}
            />
            <ContactSection
              config={config}
              onWhatsAppClick={() => handleOpenWhatsApp()}
              onBookClick={goToBooking}
            />
          </>
        );

      default:
        return (
          <>
            <Hero
              config={config}
              onBookClick={goToBooking}
              onWhatsAppClick={() => handleOpenWhatsApp()}
            />
            <HomePageOverview
              config={config}
              onNavigate={navigate}
              onBookService={(houseType, cleaningType) =>
                handleRequestQuote(houseType, cleaningType)
              }
            />
          </>
        );
    }
  };

  return (
    <div id="top" className="min-h-screen bg-[#FAF8F4] text-[#222523] flex flex-col">
      <Header
        logoText={config.logoText}
        businessName={config.businessName}
        currentPath={pathname}
        onNavigate={navigate}
      />

      <main className="flex-1 flex flex-col">
        <div className="flex-1">{renderPage()}</div>
        <SiteFooter
          config={config}
          onNavigate={navigate}
          onOwnerTrigger={() => setOwnerEntryOpen(true)}
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
        onGoToBooking={goToBooking}
      />

      {ownerEntryOpen && (
        <Suspense fallback={null}>
          <OwnerPortalModal
            isOpen={ownerEntryOpen}
            initialTab="bookings"
            onClose={() => setOwnerEntryOpen(false)}
            config={config}
            pricing={pricing}
            services={services}
            onDataUpdated={handleOwnerDataUpdated}
          />
        </Suspense>
      )}
    </div>
  );
}
