import { Check, Loader2, Lock, LogOut, MessageCircle, X } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import type {
  BookingRecord,
  BookingStatus,
  PricingCategory,
  ServiceItem,
  SiteConfig,
} from '../shared/types.ts';
import { buildWhatsAppUrl, formatKesPrice } from '../utils/whatsapp.ts';

type OwnerTab = 'bookings' | 'pricing' | 'contact' | 'services';

interface OwnerPortalModalProps {
  isOpen: boolean;
  initialTab: OwnerTab;
  onClose: () => void;
  config: SiteConfig;
  pricing: PricingCategory[];
  services: ServiceItem[];
  onDataUpdated: (next: {
    config?: SiteConfig;
    pricing?: PricingCategory[];
    services?: ServiceItem[];
  }) => void;
}

const TOKEN_STORAGE_KEY = 'lucy_clean_care_owner_token';

export function OwnerPortalModal({
  isOpen,
  initialTab,
  onClose,
  config,
  pricing,
  services,
  onDataUpdated,
}: OwnerPortalModalProps) {
  const [activeTab, setActiveTab] = useState<OwnerTab>(initialTab);
  const [token, setToken] = useState<string>(() => sessionStorage.getItem(TOKEN_STORAGE_KEY) || '');
  const [isPasscodeConfigured, setIsPasscodeConfigured] = useState<boolean | null>(null);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  const [draftPricing, setDraftPricing] = useState<
    Array<{ id: string; label: string; priceInput: string; note: string }>
  >([]);
  const [draftConfig, setDraftConfig] = useState<SiteConfig>(config);
  const [draftServices, setDraftServices] = useState<ServiceItem[]>(services);

  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    setDraftPricing(
      pricing.map((tier) => ({
        id: tier.id,
        label: tier.label,
        priceInput: tier.priceKes !== null ? String(tier.priceKes) : '',
        note: tier.note,
      }))
    );
  }, [pricing]);

  useEffect(() => {
    setDraftConfig(config);
  }, [config]);

  useEffect(() => {
    setDraftServices(services);
  }, [services]);

  useEffect(() => {
    if (!isOpen) return;
    setSaveMessage(null);
    setSaveError(null);
    setAuthError(null);

    fetch('/api/owner/status')
      .then((res) => res.json())
      .then((data) => {
        setIsPasscodeConfigured(Boolean(data.isPasscodeConfigured));
      })
      .catch(() => {
        setIsPasscodeConfigured(true);
      });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !token) return;
    setBookingsLoading(true);
    fetch('/api/owner/bookings', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (res.status === 401) {
          sessionStorage.removeItem(TOKEN_STORAGE_KEY);
          setToken('');
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.bookings) {
          setBookings(data.bookings as BookingRecord[]);
        }
      })
      .finally(() => setBookingsLoading(false));
  }, [isOpen, token]);

  if (!isOpen) return null;

  const handleAuthSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (passcodeInput.trim().length < 4) {
      setAuthError('Please enter at least 4 characters.');
      return;
    }

    setAuthLoading(true);
    try {
      const endpoint = isPasscodeConfigured ? '/api/owner/login' : '/api/owner/setup';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: passcodeInput }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data?.error || 'Authentication failed.');
        return;
      }
      sessionStorage.setItem(TOKEN_STORAGE_KEY, data.token);
      setToken(data.token);
      setPasscodeInput('');
      setIsPasscodeConfigured(true);
    } catch {
      setAuthError('Could not connect to server.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = () => {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken('');
    setBookings([]);
  };

  const handleUpdateBookingStatus = async (id: string, status: BookingStatus) => {
    setSaveError(null);
    try {
      const res = await fetch(`/api/owner/bookings/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        setSaveError('Failed to update booking status.');
        return;
      }
      const data = await res.json();
      setBookings((prev) => prev.map((b) => (b.id === id ? (data.booking as BookingRecord) : b)));
    } catch {
      setSaveError('Could not update booking status.');
    }
  };

  const handleSavePricing = async (e: FormEvent) => {
    e.preventDefault();
    setSaveMessage(null);
    setSaveError(null);
    setIsSaving(true);

    try {
      const payload = draftPricing.map((item) => {
        const trimmed = item.priceInput.trim();
        const parsed = trimmed === '' ? null : Number(trimmed);
        return {
          id: item.id,
          priceKes:
            parsed !== null && Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : null,
          note: item.note,
        };
      });

      const res = await fetch('/api/owner/pricing', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ pricing: payload }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(data?.error || 'Could not save pricing.');
        return;
      }
      onDataUpdated({ pricing: data.pricing as PricingCategory[] });
      setSaveMessage('Pricing updated successfully.');
    } catch {
      setSaveError('Could not connect to save pricing.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveConfig = async (e: FormEvent) => {
    e.preventDefault();
    setSaveMessage(null);
    setSaveError(null);
    setIsSaving(true);

    try {
      const res = await fetch('/api/owner/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ config: draftConfig }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(data?.error || 'Could not save business details.');
        return;
      }
      onDataUpdated({ config: data.config as SiteConfig });
      setSaveMessage('Business and contact details updated.');
    } catch {
      setSaveError('Could not connect to save business details.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveServices = async (e: FormEvent) => {
    e.preventDefault();
    setSaveMessage(null);
    setSaveError(null);
    setIsSaving(true);

    try {
      const res = await fetch('/api/owner/services', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ services: draftServices }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(data?.error || 'Could not save service updates.');
        return;
      }
      onDataUpdated({ services: data.services as ServiceItem[] });
      setSaveMessage('Service descriptions updated.');
    } catch {
      setSaveError('Could not connect to save services.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="owner-portal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#222523]/50 backdrop-blur-xs"
    >
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col bg-[#FAF8F4] rounded-2xl border border-[#DFD6C7] shadow-xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#DFD6C7] flex items-center justify-between gap-4 bg-[#F1ECE3]/70">
          <div>
            <p className="text-xs font-medium text-[#4F6F58]">{config.businessName} Management</p>
            <h2 id="owner-portal-title" className="font-display text-xl font-medium text-[#222523]">
              Owner Portal
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {token && (
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[38px] text-xs font-medium text-[#525753] hover:text-[#222523] rounded-lg hover:bg-[#E7E0D3] transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Sign Out</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Owner Portal"
              className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-[#525753] hover:bg-[#E7E0D3] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {!token ? (
            <div className="max-w-md mx-auto py-8">
              <div className="w-11 h-11 rounded-full bg-[#DCE6DD] text-[#4F6F58] flex items-center justify-center mb-4">
                <Lock className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="font-display text-2xl font-medium text-[#222523] mb-2">
                {isPasscodeConfigured === false
                  ? 'Set Up Your Owner Passcode'
                  : 'Sign In to Owner Portal'}
              </h3>
              <p className="text-sm text-[#525753] leading-relaxed mb-6">
                {isPasscodeConfigured === false
                  ? 'Create a private passcode (at least 4 characters) to protect customer bookings, edit KES prices, and manage all business details.'
                  : 'Enter your owner passcode to view customer bookings and update pricing, services, founder details, or contact information.'}
              </p>

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {authError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800">
                    {authError}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="owner-passcode"
                    className="block text-sm font-medium text-[#222523] mb-1.5"
                  >
                    Owner Passcode
                  </label>
                  <input
                    id="owner-passcode"
                    type="password"
                    required
                    value={passcodeInput}
                    onChange={(e) => setPasscodeInput(e.target.value)}
                    placeholder="Enter passcode"
                    className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border border-[#DFD6C7] bg-white text-[#222523] text-sm focus:outline-none focus:ring-2 focus:ring-[#4F6F58]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading || isPasscodeConfigured === null}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[44px] text-sm font-medium text-white bg-[#4F6F58] hover:bg-[#3F5A47] disabled:opacity-60 rounded-xl transition-colors cursor-pointer"
                >
                  {authLoading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                  <span>
                    {isPasscodeConfigured === false ? 'Create Passcode & Enter' : 'Sign In'}
                  </span>
                </button>
              </form>
            </div>
          ) : (
            <div>
              {/* Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#F1ECE3] rounded-xl border border-[#DFD6C7] mb-6">
                {(
                  [
                    { id: 'bookings', label: `Bookings (${bookings.length})` },
                    { id: 'pricing', label: 'Pricing (KES)' },
                    { id: 'contact', label: 'Business & Contact' },
                    { id: 'services', label: 'Services' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab.id);
                      setSaveMessage(null);
                      setSaveError(null);
                    }}
                    className={`px-3.5 py-2 min-h-[38px] text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      activeTab === tab.id
                        ? 'bg-[#FAF8F4] text-[#222523] border border-[#DFD6C7]'
                        : 'text-[#525753] hover:text-[#222523]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {saveMessage && (
                <div className="mb-5 p-3.5 rounded-xl bg-[#DCE6DD]/60 border border-[#4F6F58]/30 text-sm text-[#222523] flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#4F6F58]" aria-hidden="true" />
                  <span>{saveMessage}</span>
                </div>
              )}

              {saveError && (
                <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800">
                  {saveError}
                </div>
              )}

              {/* Tab 1: Bookings */}
              {activeTab === 'bookings' && (
                <div className="space-y-4">
                  {bookingsLoading ? (
                    <div className="py-12 flex items-center justify-center text-sm text-[#525753] gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                      <span>Loading booking requests...</span>
                    </div>
                  ) : bookings.length === 0 ? (
                    <div className="py-12 text-center bg-[#F1ECE3]/50 rounded-xl border border-[#DFD6C7] px-6">
                      <p className="font-display text-lg text-[#222523] mb-1">
                        No booking requests yet
                      </p>
                      <p className="text-sm text-[#525753]">
                        Customer booking submissions from the website will appear here automatically.
                      </p>
                    </div>
                  ) : (
                    bookings.map((booking) => {
                      const replyUrl = buildWhatsAppUrl(
                        booking.phoneNumber.startsWith('0')
                          ? `254${booking.phoneNumber.slice(1)}`
                          : booking.phoneNumber,
                        `Hello ${booking.fullName}, thank you for contacting ${config.businessName} regarding your ${booking.houseType} cleaning request (${booking.referenceCode}).`
                      );
                      return (
                        <div
                          key={booking.id}
                          className="p-5 rounded-xl border border-[#DFD6C7] bg-white space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <span className="text-xs font-medium text-[#4F6F58] tabular-nums">
                                {booking.referenceCode} · {booking.preferredDate} (
                                {booking.preferredTime})
                              </span>
                              <h4 className="font-display text-lg font-medium text-[#222523]">
                                {booking.fullName}
                              </h4>
                            </div>

                            <div className="flex items-center gap-2">
                              <select
                                aria-label={`Status for ${booking.fullName}`}
                                value={booking.status}
                                onChange={(e) =>
                                  handleUpdateBookingStatus(
                                    booking.id,
                                    e.target.value as BookingStatus
                                  )
                                }
                                className="px-3 py-1.5 min-h-[38px] text-xs font-medium rounded-lg border border-[#DFD6C7] bg-[#FAF8F4] text-[#222523]"
                              >
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                              </select>

                              {replyUrl && (
                                <a
                                  href={replyUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[38px] text-xs font-medium text-white bg-[#4F6F58] hover:bg-[#3F5A47] rounded-lg transition-colors whitespace-nowrap"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
                                  <span>Message</span>
                                </a>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs sm:text-sm text-[#525753]">
                            <div>
                              <span className="font-medium text-[#222523]">Phone:</span>{' '}
                              <span className="tabular-nums">{booking.phoneNumber}</span>
                            </div>
                            <div>
                              <span className="font-medium text-[#222523]">Estate:</span>{' '}
                              {booking.locationEstate}
                            </div>
                            <div>
                              <span className="font-medium text-[#222523]">Service:</span>{' '}
                              {booking.houseType} · {booking.cleaningType}
                            </div>
                          </div>

                          {booking.productPreference && (
                            <p className="text-xs sm:text-sm text-[#525753]">
                              <span className="font-medium text-[#222523]">Products Option:</span>{' '}
                              {booking.productPreference}
                            </p>
                          )}

                          {booking.instructions && (
                            <p className="text-xs sm:text-sm text-[#525753] pt-2 border-t border-[#DFD6C7]">
                              <span className="font-medium text-[#222523]">Instructions:</span>{' '}
                              {booking.instructions}
                            </p>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Tab 2: Pricing */}
              {activeTab === 'pricing' && (
                <form onSubmit={handleSavePricing} className="space-y-5">
                  <p className="text-sm text-[#525753]">
                    Enter amounts in Kenyan Shillings (KES), or leave the price field empty to
                    display &ldquo;Request a Quote&rdquo;.
                  </p>

                  <div className="space-y-4">
                    {draftPricing.map((tier, idx) => (
                      <div
                        key={tier.id}
                        className="p-4 rounded-xl border border-[#DFD6C7] bg-white grid grid-cols-1 sm:grid-cols-12 gap-4 items-center"
                      >
                        <div className="sm:col-span-4">
                          <span className="block font-medium text-sm text-[#222523]">
                            {tier.label}
                          </span>
                          <span className="text-xs text-[#525753] tabular-nums">
                            Current:{' '}
                            {formatKesPrice(
                              tier.priceInput.trim() ? Number(tier.priceInput) : null
                            )}
                          </span>
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-xs text-[#525753] mb-1">Price (KES)</label>
                          <input
                            type="number"
                            min="0"
                            step="50"
                            value={tier.priceInput}
                            onChange={(e) => {
                              const next = [...draftPricing];
                              next[idx] = { ...tier, priceInput: e.target.value };
                              setDraftPricing(next);
                            }}
                            placeholder="Request a Quote"
                            className="w-full px-3 py-2 min-h-[40px] rounded-lg border border-[#DFD6C7] text-sm tabular-nums"
                          />
                        </div>

                        <div className="sm:col-span-5">
                          <label className="block text-xs text-[#525753] mb-1">Scope Note</label>
                          <input
                            type="text"
                            value={tier.note}
                            onChange={(e) => {
                              const next = [...draftPricing];
                              next[idx] = { ...tier, note: e.target.value };
                              setDraftPricing(next);
                            }}
                            className="w-full px-3 py-2 min-h-[40px] rounded-lg border border-[#DFD6C7] text-sm"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] text-sm font-medium text-white bg-[#4F6F58] hover:bg-[#3F5A47] rounded-xl cursor-pointer"
                  >
                    {isSaving && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                    <span>Save Pricing Changes</span>
                  </button>
                </form>
              )}

              {/* Tab 3: Business Identity & Contact */}
              {activeTab === 'contact' && (
                <form onSubmit={handleSaveConfig} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#222523] mb-1">
                        Business Name
                      </label>
                      <input
                        type="text"
                        value={draftConfig.businessName}
                        onChange={(e) =>
                          setDraftConfig({ ...draftConfig, businessName: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border border-[#DFD6C7] bg-white text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#222523] mb-1">
                        Logo Wordmark
                      </label>
                      <input
                        type="text"
                        value={draftConfig.logoText}
                        onChange={(e) =>
                          setDraftConfig({ ...draftConfig, logoText: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border border-[#DFD6C7] bg-white text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#222523] mb-1">
                        Tagline
                      </label>
                      <input
                        type="text"
                        value={draftConfig.tagline}
                        onChange={(e) =>
                          setDraftConfig({ ...draftConfig, tagline: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border border-[#DFD6C7] bg-white text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#222523] mb-1">
                        Founder Name
                      </label>
                      <input
                        type="text"
                        value={draftConfig.founderName}
                        onChange={(e) =>
                          setDraftConfig({ ...draftConfig, founderName: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border border-[#DFD6C7] bg-white text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#222523] mb-1">
                      About the Founder Bio
                    </label>
                    <textarea
                      rows={3}
                      value={draftConfig.founderBio}
                      onChange={(e) =>
                        setDraftConfig({ ...draftConfig, founderBio: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFD6C7] bg-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#222523] mb-1">
                      Cleaning Products Policy Note
                    </label>
                    <textarea
                      rows={2}
                      value={draftConfig.productsPolicyNote}
                      onChange={(e) =>
                        setDraftConfig({ ...draftConfig, productsPolicyNote: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFD6C7] bg-white text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[#DFD6C7]">
                    <div>
                      <label className="block text-sm font-medium text-[#222523] mb-1">
                        WhatsApp Business Number
                      </label>
                      <input
                        type="text"
                        value={draftConfig.whatsappNumber}
                        onChange={(e) =>
                          setDraftConfig({ ...draftConfig, whatsappNumber: e.target.value })
                        }
                        placeholder="International digits e.g. 254746022851"
                        className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border border-[#DFD6C7] bg-white text-sm tabular-nums"
                      />
                      <p className="text-xs text-[#525753] mt-1">
                        Include country code without + (e.g. 254 for Kenya).
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#222523] mb-1">
                        Telephone Display Number
                      </label>
                      <input
                        type="text"
                        value={draftConfig.telephone}
                        onChange={(e) =>
                          setDraftConfig({ ...draftConfig, telephone: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border border-[#DFD6C7] bg-white text-sm tabular-nums"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#222523] mb-1">
                        Contact Email
                      </label>
                      <input
                        type="email"
                        value={draftConfig.email}
                        onChange={(e) => setDraftConfig({ ...draftConfig, email: e.target.value })}
                        className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border border-[#DFD6C7] bg-white text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#222523] mb-1">
                        Primary Location
                      </label>
                      <input
                        type="text"
                        value={draftConfig.city}
                        onChange={(e) => setDraftConfig({ ...draftConfig, city: e.target.value })}
                        className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border border-[#DFD6C7] bg-white text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#222523] mb-1">
                      Service Area Description
                    </label>
                    <input
                      type="text"
                      value={draftConfig.serviceAreas}
                      onChange={(e) =>
                        setDraftConfig({ ...draftConfig, serviceAreas: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border border-[#DFD6C7] bg-white text-sm"
                    />
                  </div>

                  <div className="pt-3 border-t border-[#DFD6C7]">
                    <h4 className="text-sm font-medium text-[#222523] mb-3">
                      Social Media Links (Optional)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-[#525753] mb-1">Instagram URL</label>
                        <input
                          type="url"
                          value={draftConfig.socialLinks.instagram}
                          onChange={(e) =>
                            setDraftConfig({
                              ...draftConfig,
                              socialLinks: {
                                ...draftConfig.socialLinks,
                                instagram: e.target.value,
                              },
                            })
                          }
                          placeholder="https://instagram.com/..."
                          className="w-full px-3 py-2 min-h-[40px] rounded-lg border border-[#DFD6C7] bg-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#525753] mb-1">Facebook URL</label>
                        <input
                          type="url"
                          value={draftConfig.socialLinks.facebook}
                          onChange={(e) =>
                            setDraftConfig({
                              ...draftConfig,
                              socialLinks: {
                                ...draftConfig.socialLinks,
                                facebook: e.target.value,
                              },
                            })
                          }
                          placeholder="https://facebook.com/..."
                          className="w-full px-3 py-2 min-h-[40px] rounded-lg border border-[#DFD6C7] bg-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#525753] mb-1">TikTok URL</label>
                        <input
                          type="url"
                          value={draftConfig.socialLinks.tiktok}
                          onChange={(e) =>
                            setDraftConfig({
                              ...draftConfig,
                              socialLinks: { ...draftConfig.socialLinks, tiktok: e.target.value },
                            })
                          }
                          placeholder="https://tiktok.com/@..."
                          className="w-full px-3 py-2 min-h-[40px] rounded-lg border border-[#DFD6C7] bg-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#525753] mb-1">X URL</label>
                        <input
                          type="url"
                          value={draftConfig.socialLinks.x}
                          onChange={(e) =>
                            setDraftConfig({
                              ...draftConfig,
                              socialLinks: { ...draftConfig.socialLinks, x: e.target.value },
                            })
                          }
                          placeholder="https://x.com/..."
                          className="w-full px-3 py-2 min-h-[40px] rounded-lg border border-[#DFD6C7] bg-white text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] text-sm font-medium text-white bg-[#4F6F58] hover:bg-[#3F5A47] rounded-xl cursor-pointer"
                  >
                    {isSaving && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                    <span>Save Business Details</span>
                  </button>
                </form>
              )}

              {/* Tab 4: Services */}
              {activeTab === 'services' && (
                <form onSubmit={handleSaveServices} className="space-y-4">
                  <p className="text-sm text-[#525753]">
                    Update service titles or descriptions shown on the homepage without changing any
                    code.
                  </p>
                  {draftServices.map((service, idx) => (
                    <div
                      key={service.id}
                      className="p-4 rounded-xl border border-[#DFD6C7] bg-white space-y-3"
                    >
                      <input
                        type="text"
                        value={service.title}
                        onChange={(e) => {
                          const next = [...draftServices];
                          next[idx] = { ...service, title: e.target.value };
                          setDraftServices(next);
                        }}
                        className="w-full px-3 py-2 min-h-[40px] rounded-lg border border-[#DFD6C7] text-sm font-medium"
                      />
                      <textarea
                        rows={2}
                        value={service.description}
                        onChange={(e) => {
                          const next = [...draftServices];
                          next[idx] = { ...service, description: e.target.value };
                          setDraftServices(next);
                        }}
                        className="w-full px-3 py-2 rounded-lg border border-[#DFD6C7] text-sm"
                      />
                    </div>
                  ))}
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] text-sm font-medium text-white bg-[#4F6F58] hover:bg-[#3F5A47] rounded-xl cursor-pointer"
                  >
                    {isSaving && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                    <span>Save Service Descriptions</span>
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
