import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { BrandMark } from './BrandMark.tsx';

interface HeaderProps {
  logoText: string;
  businessName: string;
  onBookClick: () => void;
}

const NAV_LINKS = [
  { href: '#about', label: 'About' },
  { href: '#services', label: 'Services' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#team', label: 'Founder' },
  { href: '#contact', label: 'Contact' },
] as const;

export function Header({ logoText, businessName, onBookClick }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleMobileNav = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F4]/95 backdrop-blur-md border-b border-[#DDD4C3]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-[72px] flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <a
          href="#top"
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4332] rounded-md py-1 whitespace-nowrap shrink-0"
          aria-label={`${businessName} Home`}
        >
          <BrandMark logoText={logoText} />
        </a>

        {/* Zone 2: Concise Single-Line Navigation Links */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-[#4A504B]"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="whitespace-nowrap shrink-0 hover:text-[#1B4332] transition-colors duration-150 py-1.5 border-b-2 border-transparent hover:border-[#1B4332] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4332] rounded-sm"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Zone 3: Primary Action + Mobile Menu Trigger */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onBookClick}
            className="hidden sm:inline-flex items-center justify-center px-5 py-2.5 min-h-[42px] text-sm font-medium text-white bg-[#1B4332] hover:bg-[#143325] rounded-xl shadow-[0_6px_18px_-6px_rgba(27,67,50,0.45)] transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4332] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF8F4]"
          >
            Book a Cleaning
          </button>

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
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={handleMobileNav}
              className="block px-3 py-3 min-h-[44px] text-base font-medium text-[#222523] rounded-xl hover:bg-[#F4EFE6] hover:text-[#1B4332] transition-colors"
            >
              {link.label}
            </a>
          ))}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onBookClick();
              }}
              className="w-full px-5 py-3 min-h-[44px] text-sm font-medium text-white bg-[#1B4332] hover:bg-[#143325] rounded-xl transition-colors cursor-pointer"
            >
              Book a Cleaning
            </button>
          </div>
        </nav>
      )}
    </header>
  );
}
