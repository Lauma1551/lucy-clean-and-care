import { Menu, X } from 'lucide-react';
import { useState, type MouseEvent } from 'react';
import { BrandMark } from './BrandMark.tsx';

interface HeaderProps {
  logoText: string;
  businessName: string;
  currentPath: string;
  onNavigate: (path: string) => void;
}

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About Us' },
  { href: '/services', label: 'Services' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/contact', label: 'Contact' },
  { href: '/founder', label: 'Founder' },
] as const;

export function Header({
  logoText,
  businessName,
  currentPath,
  onNavigate,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLinkClick = (e: MouseEvent<HTMLAnchorElement>, path: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    onNavigate(path);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F4]/95 backdrop-blur-md border-b border-[#DDD4C3]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-[72px] flex items-center justify-between gap-6">
        {/* Zone 1: Brand Wordmark */}
        <a
          href="/"
          onClick={(e) => handleLinkClick(e, '/')}
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4332] rounded-md py-1 whitespace-nowrap shrink-0"
          aria-label={`${businessName} Home`}
        >
          <BrandMark logoText={logoText} />
        </a>

        {/* Zone 2: Single-Line Page Navigation Links */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-[#4A504B]"
        >
          {NAV_LINKS.map((link) => {
            const isActive = currentPath === link.href;
            return (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link.href)}
                aria-current={isActive ? 'page' : undefined}
                className={`whitespace-nowrap shrink-0 transition-colors duration-150 py-1.5 border-b-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4332] rounded-sm ${
                  isActive
                    ? 'text-[#1B4332] border-[#1B4332] font-semibold'
                    : 'border-transparent hover:text-[#1B4332] hover:border-[#1B4332]/50'
                }`}
              >
                {link.label}
              </a>
            );
          })}
        </nav>

        {/* Zone 3: Primary Action + Mobile Menu Trigger */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="/book"
            onClick={(e) => handleLinkClick(e, '/book')}
            className="hidden sm:inline-flex items-center justify-center px-5 py-2.5 min-h-[42px] text-sm font-medium text-white bg-[#1B4332] hover:bg-[#143325] rounded-xl shadow-[0_6px_18px_-6px_rgba(27,67,50,0.45)] transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4332] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF8F4]"
          >
            Book a Cleaning
          </a>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-xl border border-[#DDD4C3] text-[#1B4332] hover:bg-[#F4EFE6] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4332]"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <nav
          aria-label="Mobile Navigation"
          className="md:hidden border-t border-[#DDD4C3] bg-[#FAF8F4] px-4 py-4 space-y-1"
        >
          {NAV_LINKS.map((link) => {
            const isActive = currentPath === link.href;
            return (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link.href)}
                aria-current={isActive ? 'page' : undefined}
                className={`block px-3 py-3 min-h-[44px] text-base font-medium rounded-xl transition-colors ${
                  isActive
                    ? 'bg-[#DCE6DD]/60 text-[#1B4332] font-semibold'
                    : 'text-[#222523] hover:bg-[#F4EFE6] hover:text-[#1B4332]'
                }`}
              >
                {link.label}
              </a>
            );
          })}
          <div className="pt-2">
            <a
              href="/book"
              onClick={(e) => handleLinkClick(e, '/book')}
              className="flex items-center justify-center w-full px-5 py-3 min-h-[44px] text-sm font-medium text-white bg-[#1B4332] hover:bg-[#143325] rounded-xl transition-colors"
            >
              Book a Cleaning
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
