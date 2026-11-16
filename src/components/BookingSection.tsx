import { CheckCircle2, Loader2, MessageCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState, type FormEvent } from 'react';
import {
  CLEANING_TYPES,
  HOUSE_TYPES,
  PREFERRED_TIMES,
  PRODUCT_PREFERENCES,
} from '../shared/defaults.ts';
import type {
  BookingRecord,
  BookingRequestPayload,
  PricingCategory,
  SiteConfig,
} from '../shared/types.ts';
import { buildBookingWhatsAppMessage, formatKesPrice } from '../utils/whatsapp.ts';

interface BookingSectionProps {
  config: SiteConfig;
  selectedHouseType: string;
  selectedCleaningType: string;
  pricing: PricingCategory[];
  onContinueOnWhatsApp: (message: string) => void;
}

function getTodayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function BookingSection({
  config,
  selectedHouseType,
  selectedCleaningType,
  pricing,
  onContinueOnWhatsApp,
}: BookingSectionProps) {
  const [form, setForm] = useState<BookingRequestPayload>({
    fullName: '',
    phoneNumber: '',
    locationEstate: '',
    houseType: selectedHouseType || HOUSE_TYPES[0],
    preferredDate: getTodayDateString(),
    preferredTime: PREFERRED_TIMES[0],
    cleaningType: selectedCleaningType || CLEANING_TYPES[0],
    productPreference: PRODUCT_PREFERENCES[0],
    instructions: '',
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<BookingRecord | null>(null);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      houseType: selectedHouseType || prev.houseType,
      cleaningType: selectedCleaningType || prev.cleaningType,
    }));
  }, [selectedHouseType, selectedCleaningType]);

  const matchingTier = pricing.find((tier) => tier.houseTypeValue === form.houseType);

  const validateClient = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (form.fullName.trim().length < 2) {
      errors.fullName = 'Please enter your full name.';
    }
    const digits = form.phoneNumber.replace(/[^\d]/g, '');
    if (digits.length < 9 || digits.length > 15) {
      errors.phoneNumber = 'Please enter a valid phone number (e.g. 07XX XXX XXX).';
    }
    if (form.locationEstate.trim().length < 2) {
      errors.locationEstate = 'Please enter your estate or area (e.g. Roysambu).';
    }
    if (!form.houseType) {
      errors.houseType = 'Please select your house size.';
    }
    if (!form.preferredDate) {
      errors.preferredDate = 'Please select a preferred cleaning date.';
    }
    if (!form.preferredTime) {
      errors.preferredTime = 'Please select a preferred time.';
    }
    if (!form.cleaningType) {
      errors.cleaningType = 'Please select the type of cleaning required.';
    }
    if (!form.productPreference) {
      errors.productPreference = 'Please select your cleaning products preference.';
    }
    return errors;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const errors = validateClient();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (!response.ok) {
        if (data?.fieldErrors && typeof data.fieldErrors === 'object') {
          setFieldErrors(data.fieldErrors);
        }
        setSubmitError(data?.error || 'Could not submit your booking request. Please check the form.');
        return;
      }

      setConfirmedBooking(data.booking as BookingRecord);
      setFieldErrors({});
    } catch {
      setSubmitError(
        'Unable to reach the booking server right now. Please try again or reach us via WhatsApp.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewBooking = () => {
    setConfirmedBooking(null);
    setSubmitError(null);
    setForm({
      fullName: '',
      phoneNumber: '',
      locationEstate: '',
      houseType: selectedHouseType || HOUSE_TYPES[0],
      preferredDate: getTodayDateString(),
      preferredTime: PREFERRED_TIMES[0],
      cleaningType: selectedCleaningType || CLEANING_TYPES[0],
      productPreference: PRODUCT_PREFERENCES[0],
      instructions: '',
    });
  };

  return (
    <section id="booking" className="py-16 sm:py-22 lg:py-24 border-b border-[#DDD4C3]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start"
        >
          {/* Left Context Column */}
          <div className="lg:col-span-5">
            <p className="text-xs font-medium tracking-wide text-[#1B4332] mb-3">
              Book a Cleaning
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-medium tracking-tight text-[#222523] [text-wrap:balance] mb-4">
              Request a home cleaning in Roysambu &amp; nearby estates.
            </h2>
            <p className="text-base text-[#525753] leading-relaxed mb-8">
              Share your details, house size, preferred date, and cleaning product preference below.
              Your request is saved securely and you can continue on WhatsApp right away.
            </p>

            <div className="bg-[#F4EFE6] rounded-2xl border border-[#DDD4C3] p-6 space-y-4 shadow-[0_12px_28px_-18px_rgba(27,67,50,0.12)]">
              <div>
                <span className="block text-xs font-medium text-[#525753] mb-1">
                  Selected House Size
                </span>
                <span className="font-display text-lg font-medium text-[#222523]">
                  {form.houseType}
                </span>
              </div>
              <div className="pt-3 border-t border-[#DDD4C3]">
                <span className="block text-xs font-medium text-[#525753] mb-1">
                  Products Preference
                </span>
                <span className="text-sm font-medium text-[#222523]">
                  {form.productPreference}
                </span>
              </div>
              <div className="pt-3 border-t border-[#DDD4C3] flex items-center justify-between gap-4">
                <span className="text-sm text-[#525753]">Estimated Rate</span>
                <span className="text-base font-semibold text-[#1B4332] tabular-nums">
                  {formatKesPrice(matchingTier ? matchingTier.priceKes : null)}
                </span>
              </div>
              <p className="text-xs text-[#525753] leading-relaxed">
                Final pricing may differ depending on house size, home condition, and whether{' '}
                {config.businessName} supplies the cleaning products and equipment or you provide
                them.
              </p>
            </div>
          </div>

          {/* Right Form or Confirmation Column */}
          <div className="lg:col-span-7">
            {confirmedBooking ? (
              <div
                role="status"
                aria-live="polite"
                className="bg-[#FAF8F4] rounded-2xl border border-[#1B4332]/35 p-7 sm:p-9 shadow-[0_16px_36px_-18px_rgba(27,67,50,0.18)]"
              >
                <div className="flex items-start gap-3.5 mb-6">
                  <CheckCircle2
                    className="w-6 h-6 text-[#1B4332] shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-xs font-medium text-[#1B4332] mb-1">
                      Booking Request Saved · {confirmedBooking.referenceCode}
                    </p>
                    <h3 className="font-display text-2xl font-medium text-[#222523]">
                      Thank you, {confirmedBooking.fullName}.
                    </h3>
                    <p className="text-sm sm:text-base text-[#525753] mt-1.5">
                      Your cleaning request has been recorded. Continue on WhatsApp to confirm your
                      quotation and arrival details directly with {config.businessName}.
                    </p>
                  </div>
                </div>

                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-5 border-y border-[#DDD4C3] text-sm">
                  <div>
                    <dt className="text-[#525753]">Location / Estate</dt>
                    <dd className="font-medium text-[#222523] mt-0.5">
                      {confirmedBooking.locationEstate}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[#525753]">Phone Number</dt>
                    <dd className="font-medium text-[#222523] mt-0.5 tabular-nums">
                      {confirmedBooking.phoneNumber}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[#525753]">House &amp; Service</dt>
                    <dd className="font-medium text-[#222523] mt-0.5">
                      {confirmedBooking.houseType} · {confirmedBooking.cleaningType}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[#525753]">Preferred Date &amp; Time</dt>
                    <dd className="font-medium text-[#222523] mt-0.5 tabular-nums">
                      {confirmedBooking.preferredDate} · {confirmedBooking.preferredTime}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-[#525753]">Cleaning Products Option</dt>
                    <dd className="font-medium text-[#222523] mt-0.5">
                      {confirmedBooking.productPreference}
                    </dd>
                  </div>
                </dl>

                <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      onContinueOnWhatsApp(
                        buildBookingWhatsAppMessage(confirmedBooking, config.businessName)
                      )
                    }
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[46px] text-sm font-medium text-white bg-[#1B4332] hover:bg-[#143325] rounded-xl shadow-[0_8px_20px_-8px_rgba(27,67,50,0.45)] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4332]"
                  >
                    <MessageCircle className="w-4 h-4" aria-hidden="true" />
                    <span>Continue Booking on WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNewBooking}
                    className="inline-flex items-center justify-center px-5 py-3 min-h-[46px] text-sm font-medium text-[#222523] bg-[#F4EFE6] hover:bg-[#E9E2D4] border border-[#DDD4C3] rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Submit Another Request
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                noValidate
                className="bg-[#FAF8F4] rounded-2xl border border-[#DDD4C3] p-6 sm:p-8 space-y-5 shadow-[0_14px_34px_-18px_rgba(27,67,50,0.14)]"
              >
                {submitError && (
                  <div
                    role="alert"
                    className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800"
                  >
                    {submitError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="booking-fullName"
                      className="block text-sm font-medium text-[#222523] mb-1.5"
                    >
                      Customer&apos;s Full Name
                    </label>
                    <input
                      id="booking-fullName"
                      type="text"
                      required
                      value={form.fullName}
                      onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                      placeholder="Your full name"
                      aria-invalid={Boolean(fieldErrors.fullName)}
                      className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border border-[#DDD4C3] bg-white text-[#222523] placeholder:text-[#525753]/60 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-[#1B4332]"
                    />
                    {fieldErrors.fullName && (
                      <p className="mt-1 text-xs text-red-700">{fieldErrors.fullName}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="booking-phone"
                      className="block text-sm font-medium text-[#222523] mb-1.5"
                    >
                      Phone Number
                    </label>
                    <input
                      id="booking-phone"
                      type="tel"
                      required
                      value={form.phoneNumber}
                      onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                      placeholder="e.g. 07XX XXX XXX"
                      aria-invalid={Boolean(fieldErrors.phoneNumber)}
                      className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border border-[#DDD4C3] bg-white text-[#222523] placeholder:text-[#525753]/60 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-[#1B4332]"
                    />
                    {fieldErrors.phoneNumber && (
                      <p className="mt-1 text-xs text-red-700">{fieldErrors.phoneNumber}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="booking-location"
                    className="block text-sm font-medium text-[#222523] mb-1.5"
                  >
                    Location or Estate
                  </label>
                  <input
                    id="booking-location"
                    type="text"
                    required
                    value={form.locationEstate}
                    onChange={(e) => setForm({ ...form, locationEstate: e.target.value })}
                    placeholder="e.g. Roysambu or nearby estate in Nairobi"
                    aria-invalid={Boolean(fieldErrors.locationEstate)}
                    className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border border-[#DDD4C3] bg-white text-[#222523] placeholder:text-[#525753]/60 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-[#1B4332]"
                  />
                  {fieldErrors.locationEstate && (
                    <p className="mt-1 text-xs text-red-700">{fieldErrors.locationEstate}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="booking-houseType"
                      className="block text-sm font-medium text-[#222523] mb-1.5"
                    >
                      House Size
                    </label>
                    <select
                      id="booking-houseType"
                      value={form.houseType}
                      onChange={(e) => setForm({ ...form, houseType: e.target.value })}
                      aria-invalid={Boolean(fieldErrors.houseType)}
                      className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border border-[#DDD4C3] bg-white text-[#222523] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-[#1B4332]"
                    >
                      {HOUSE_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.houseType && (
                      <p className="mt-1 text-xs text-red-700">{fieldErrors.houseType}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="booking-cleaningType"
                      className="block text-sm font-medium text-[#222523] mb-1.5"
                    >
                      Type of Cleaning Required
                    </label>
                    <select
                      id="booking-cleaningType"
                      value={form.cleaningType}
                      onChange={(e) => setForm({ ...form, cleaningType: e.target.value })}
                      aria-invalid={Boolean(fieldErrors.cleaningType)}
                      className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border border-[#DDD4C3] bg-white text-[#222523] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-[#1B4332]"
                    >
                      {CLEANING_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.cleaningType && (
                      <p className="mt-1 text-xs text-red-700">{fieldErrors.cleaningType}</p>
                    )}
                  </div>
                </div>

                <div>
                  <span className="block text-sm font-medium text-[#222523] mb-2">
                    Cleaning Products Preference
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {PRODUCT_PREFERENCES.map((option) => {
                      const isSelected = form.productPreference === option;
                      return (
                        <label
                          key={option}
                          className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                            isSelected
                              ? 'border-[#1B4332] bg-[#DCE6DD]/55'
                              : 'border-[#DDD4C3] bg-white hover:border-[#4F6F58]'
                          }`}
                        >
                          <input
                            type="radio"
                            name="productPreference"
                            value={option}
                            checked={isSelected}
                            onChange={(e) =>
                              setForm({ ...form, productPreference: e.target.value })
                            }
                            className="mt-1 accent-[#1B4332]"
                          />
                          <span className="text-sm text-[#222523] leading-snug">{option}</span>
                        </label>
                      );
                    })}
                  </div>
                  <p className="mt-1.5 text-xs text-[#525753]">
                    Note: Pricing may differ depending on the selected option.
                  </p>
                  {fieldErrors.productPreference && (
                    <p className="mt-1 text-xs text-red-700">{fieldErrors.productPreference}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="booking-date"
                      className="block text-sm font-medium text-[#222523] mb-1.5"
                    >
                      Preferred Cleaning Date
                    </label>
                    <input
                      id="booking-date"
                      type="date"
                      required
                      min={getTodayDateString()}
                      value={form.preferredDate}
                      onChange={(e) => setForm({ ...form, preferredDate: e.target.value })}
                      aria-invalid={Boolean(fieldErrors.preferredDate)}
                      className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border border-[#DDD4C3] bg-white text-[#222523] text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-[#1B4332]"
                    />
                    {fieldErrors.preferredDate && (
                      <p className="mt-1 text-xs text-red-700">{fieldErrors.preferredDate}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="booking-time"
                      className="block text-sm font-medium text-[#222523] mb-1.5"
                    >
                      Preferred Time
                    </label>
                    <select
                      id="booking-time"
                      value={form.preferredTime}
                      onChange={(e) => setForm({ ...form, preferredTime: e.target.value })}
                      aria-invalid={Boolean(fieldErrors.preferredTime)}
                      className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border border-[#DDD4C3] bg-white text-[#222523] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-[#1B4332]"
                    >
                      {PREFERRED_TIMES.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.preferredTime && (
                      <p className="mt-1 text-xs text-red-700">{fieldErrors.preferredTime}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="booking-instructions"
                    className="block text-sm font-medium text-[#222523] mb-1.5"
                  >
                    Additional Instructions{' '}
                    <span className="text-[#525753] font-normal">(Optional)</span>
                  </label>
                  <textarea
                    id="booking-instructions"
                    rows={3}
                    value={form.instructions}
                    onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                    placeholder="Mention estate gate access notes, pets, specific rooms needing extra attention, or preferred cleaning supplies."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDD4C3] bg-white text-[#222523] placeholder:text-[#525753]/60 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-[#1B4332]"
                  />
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center gap-2 px-7 py-3.5 min-h-[48px] text-sm sm:text-base font-medium text-white bg-[#1B4332] hover:bg-[#143325] disabled:opacity-60 rounded-xl shadow-[0_10px_22px_-8px_rgba(27,67,50,0.45)] transition-all whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4332] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF8F4]"
                  >
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                    <span>
                      {isSubmitting ? 'Saving Booking Request...' : 'Submit Booking Request'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onContinueOnWhatsApp(
                        `Hello ${config.businessName}, I would like to book ${form.cleaningType} for a ${form.houseType} (${form.productPreference}).`
                      )
                    }
                    className="inline-flex items-center justify-center gap-2 px-5 py-3.5 min-h-[48px] text-sm font-medium text-[#1B4332] bg-[#F4EFE6] hover:bg-[#E9E2D4] border border-[#C9C1B0] rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 text-[#1B4332]" aria-hidden="true" />
                    <span>Book Directly on WhatsApp</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
