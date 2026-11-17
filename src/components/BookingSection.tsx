import { CalendarClock, CheckCircle2, Loader2, MessageCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState, type FormEvent } from 'react';
import {
  activeFirebaseError,
  isFirebaseConfigured,
} from '../lib/firebase.ts';
import {
  extractReadableError,
  submitBookingChangeRequest,
  submitCustomerBooking,
  triggerWhatsAppNotification,
  validateBookingChangeRequestPayload,
  validateBookingPayload,
} from '../lib/firestoreService.ts';
import {
  CLEANING_TYPES,
  HOUSE_TYPES,
  PREFERRED_TIMES,
  PRODUCT_PREFERENCES,
} from '../shared/defaults.ts';
import type {
  BookingChangeRequestPayload,
  BookingChangeRequestRecord,
  BookingRecord,
  BookingRequestPayload,
  PricingCategory,
  SiteConfig,
} from '../shared/types.ts';
import { buildBookingWhatsAppMessage } from '../utils/whatsapp.ts';
import { CLEANING_PRICE_MATRIX, type HomeOccupancyOption } from './PricingSection.tsx';

interface BookingSectionProps {
  config: SiteConfig;
  selectedHouseType: string;
  selectedCleaningType: string;
  selectedOccupancy?: HomeOccupancyOption;
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
  selectedOccupancy = 'occupied',
  onContinueOnWhatsApp,
}: BookingSectionProps) {
  const [form, setForm] = useState<BookingRequestPayload>({
    fullName: '',
    phoneNumber: '',
    email: '',
    locationEstate: '',
    houseType: selectedHouseType || HOUSE_TYPES[0],
    preferredDate: getTodayDateString(),
    preferredTime: PREFERRED_TIMES[0],
    cleaningType: selectedCleaningType || CLEANING_TYPES[0],
    productPreference: PRODUCT_PREFERENCES[0],
    instructions: '',
    whatsappConsent: false,
  });
  const [occupancy, setOccupancy] = useState<HomeOccupancyOption>(selectedOccupancy);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<BookingRecord | null>(null);

  const [changeOpen, setChangeOpen] = useState(false);
  const [changeForm, setChangeForm] = useState<BookingChangeRequestPayload>({
    referenceCode: '',
    phoneNumber: '',
    requestType: 'reschedule',
    requestedDate: getTodayDateString(),
    requestedTime: PREFERRED_TIMES[0],
    reason: '',
  });
  const [changeErrors, setChangeErrors] = useState<Record<string, string>>({});
  const [changeSubmitError, setChangeSubmitError] = useState<string | null>(null);
  const [isSubmittingChange, setIsSubmittingChange] = useState(false);
  const [submittedChangeRequest, setSubmittedChangeRequest] =
    useState<BookingChangeRequestRecord | null>(null);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      houseType: selectedHouseType || prev.houseType,
      cleaningType: selectedCleaningType || prev.cleaningType,
    }));
  }, [selectedHouseType, selectedCleaningType]);

  useEffect(() => {
    if (selectedOccupancy) {
      setOccupancy(selectedOccupancy);
    }
  }, [selectedOccupancy]);

  const matchingPriceRow = CLEANING_PRICE_MATRIX.find(
    (row) => row.houseTypeValue === form.houseType
  );
  const indicativeRateLabel = matchingPriceRow
    ? occupancy === 'new_unoccupied'
      ? matchingPriceRow.newHousePrice
      : matchingPriceRow.occupiedPrice
    : 'Request a Quote';
  const occupancyLabel =
    occupancy === 'new_unoccupied'
      ? 'New House Cleaning – Before Occupation (Unoccupied)'
      : 'Standard Cleaning – Occupied Home';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const errors = validateBookingPayload(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    if (!isFirebaseConfigured) {
      setSubmitError(
        activeFirebaseError ||
          'Online booking database is not configured yet. Please use WhatsApp below to book directly.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const occupancyTag = `Home Occupancy: ${occupancyLabel}`;
      const combinedInstructions = form.instructions.trim()
        ? `${occupancyTag}\n${form.instructions.trim()}`
        : occupancyTag;

      const savedBooking = await submitCustomerBooking({
        ...form,
        instructions: combinedInstructions,
      });
      setConfirmedBooking(savedBooking);
      setFieldErrors({});

      // Notify the business owner via secure server-side WhatsApp endpoint (fire-and-forget)
      triggerWhatsAppNotification({
        event: 'owner_new_booking',
        idempotencyKey: `owner_new:${savedBooking.id}`,
        referenceCode: savedBooking.referenceCode,
        customerName: savedBooking.fullName,
        customerPhone: savedBooking.phoneNumber,
        locationEstate: savedBooking.locationEstate,
        houseType: savedBooking.houseType,
        cleaningType: savedBooking.cleaningType,
        preferredDate: savedBooking.preferredDate,
        preferredTime: savedBooking.preferredTime,
        productPreference: savedBooking.productPreference,
      }).catch(() => {});
    } catch (error) {
      setSubmitError(
        extractReadableError(
          error,
          'Unable to save your booking request right now. Please try again or reach us via WhatsApp.'
        )
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
      email: '',
      locationEstate: '',
      houseType: selectedHouseType || HOUSE_TYPES[0],
      preferredDate: getTodayDateString(),
      preferredTime: PREFERRED_TIMES[0],
      cleaningType: selectedCleaningType || CLEANING_TYPES[0],
      productPreference: PRODUCT_PREFERENCES[0],
      instructions: '',
      whatsappConsent: false,
    });
  };

  const handleChangeSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setChangeSubmitError(null);

    const errors = validateBookingChangeRequestPayload(changeForm);
    setChangeErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    if (!isFirebaseConfigured) {
      setChangeSubmitError(
        activeFirebaseError || 'Online booking database is not configured yet.'
      );
      return;
    }

    setIsSubmittingChange(true);
    try {
      const savedRequest = await submitBookingChangeRequest(changeForm);
      setSubmittedChangeRequest(savedRequest);
      setChangeErrors({});

      triggerWhatsAppNotification({
        event:
          savedRequest.requestType === 'cancel'
            ? 'owner_cancel_request'
            : 'owner_reschedule_request',
        idempotencyKey: `owner_change:${savedRequest.id}`,
        referenceCode: savedRequest.referenceCode,
        customerPhone: savedRequest.phoneNumber,
        requestedDate: savedRequest.requestedDate,
        requestedTime: savedRequest.requestedTime,
        reason: savedRequest.reason,
      }).catch(() => {});
    } catch (error) {
      setChangeSubmitError(
        extractReadableError(
          error,
          'Could not submit your booking change request. Please try again or contact us on WhatsApp.'
        )
      );
    } finally {
      setIsSubmittingChange(false);
    }
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
              Request a home cleaning in {config.serviceAreas.toLowerCase()}.
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
                  Home Occupancy
                </span>
                <span className="text-sm font-medium text-[#222523]">{occupancyLabel}</span>
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
                <span className="text-sm text-[#525753]">Indicative Rate</span>
                <span className="text-base font-semibold text-[#1B4332] tabular-nums">
                  {indicativeRateLabel}
                </span>
              </div>
              <p className="text-xs text-[#525753] leading-relaxed">
                All prices are indicative and may vary depending on house size, location and
                cleaning requirements. Final quotations are confirmed with you before booking
                acceptance.
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

                <div className="mb-6 rounded-xl border border-[#1B4332]/25 bg-[#DCE6DD]/45 px-4 py-3.5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="block text-xs font-medium text-[#4F6F58]">
                      Your Booking Reference
                    </span>
                    <span className="font-mono text-lg sm:text-xl font-semibold tracking-wider text-[#1B4332] select-all">
                      {confirmedBooking.referenceCode}
                    </span>
                  </div>
                  <p className="text-xs text-[#4E544F] max-w-xs">
                    Keep this reference code to confirm, reschedule, or cancel your appointment.
                  </p>
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
                  {confirmedBooking.email && (
                    <div className="sm:col-span-2">
                      <dt className="text-[#525753]">Email Address</dt>
                      <dd className="font-medium text-[#222523] mt-0.5">
                        {confirmedBooking.email}
                      </dd>
                    </div>
                  )}
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
                  <div className="sm:col-span-2">
                    <dt className="text-[#525753]">WhatsApp Notification Updates</dt>
                    <dd className="font-medium text-[#222523] mt-0.5">
                      {confirmedBooking.whatsappConsent
                        ? 'Opted in — you will receive updates when your booking is confirmed, changed, or cancelled.'
                        : 'Not opted in — we will contact you by phone or email if needed.'}
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
                {!isFirebaseConfigured && activeFirebaseError && (
                  <div
                    role="alert"
                    className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-900"
                  >
                    {activeFirebaseError} You can still send your request directly via WhatsApp
                    below.
                  </div>
                )}

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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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

                  <div>
                    <label
                      htmlFor="booking-email"
                      className="block text-sm font-medium text-[#222523] mb-1.5"
                    >
                      Email Address{' '}
                      <span className="text-[#525753] font-normal">(Optional)</span>
                    </label>
                    <input
                      id="booking-email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="you@example.com"
                      aria-invalid={Boolean(fieldErrors.email)}
                      className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border border-[#DDD4C3] bg-white text-[#222523] placeholder:text-[#525753]/60 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-[#1B4332]"
                    />
                    {fieldErrors.email && (
                      <p className="mt-1 text-xs text-red-700">{fieldErrors.email}</p>
                    )}
                  </div>
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
                    Home Occupancy Category
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(
                      [
                        {
                          id: 'occupied',
                          title: 'Occupied Home',
                          desc: 'Standard cleaning for a home you currently live in',
                        },
                        {
                          id: 'new_unoccupied',
                          title: 'New House – Before Occupation',
                          desc: 'Pre-occupation clean for a new, empty house',
                        },
                      ] as const
                    ).map((opt) => {
                      const isSelected = occupancy === opt.id;
                      return (
                        <label
                          key={opt.id}
                          className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                            isSelected
                              ? 'border-[#1B4332] bg-[#DCE6DD]/55'
                              : 'border-[#DDD4C3] bg-white hover:border-[#4F6F58]'
                          }`}
                        >
                          <input
                            type="radio"
                            name="homeOccupancy"
                            value={opt.id}
                            checked={isSelected}
                            onChange={() => setOccupancy(opt.id)}
                            className="mt-1 accent-[#1B4332]"
                          />
                          <span>
                            <span className="block text-sm font-medium text-[#222523] leading-snug">
                              {opt.title}
                            </span>
                            <span className="block text-xs text-[#525753] mt-0.5 leading-snug">
                              {opt.desc}
                            </span>
                          </span>
                        </label>
                      );
                    })}
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

                <label className="flex items-start gap-3 p-3.5 rounded-xl border border-[#DDD4C3] bg-[#F4EFE6]/60 cursor-pointer">
                  <input
                    id="booking-whatsappConsent"
                    type="checkbox"
                    checked={form.whatsappConsent}
                    onChange={(e) => setForm({ ...form, whatsappConsent: e.target.checked })}
                    className="mt-1 accent-[#1B4332] shrink-0"
                  />
                  <span className="text-xs sm:text-sm text-[#3B3F3C] leading-relaxed">
                    I agree to receive WhatsApp notifications from {config.businessName} on the
                    phone number above regarding booking confirmation, appointment changes, or
                    cancellations.
                  </span>
                </label>

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

            {/* Existing Booking Reschedule / Cancellation Request Panel */}
            <div className="mt-6 bg-[#F4EFE6]/70 rounded-2xl border border-[#DDD4C3] p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <CalendarClock className="w-4 h-4 text-[#1B4332] shrink-0" aria-hidden="true" />
                  <span className="text-sm font-medium text-[#222523]">
                    Already booked? Request to reschedule or cancel
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setChangeOpen((prev) => !prev);
                    setSubmittedChangeRequest(null);
                    setChangeSubmitError(null);
                  }}
                  aria-expanded={changeOpen}
                  className="px-3.5 py-2 min-h-[38px] text-xs font-medium text-[#1B4332] bg-[#FAF8F4] hover:bg-[#E9E2D4] border border-[#DDD4C3] rounded-xl transition-colors cursor-pointer"
                >
                  {changeOpen ? 'Hide Form' : 'Manage Existing Booking'}
                </button>
              </div>

              {changeOpen && (
                <div className="mt-5 pt-5 border-t border-[#DDD4C3]">
                  {submittedChangeRequest ? (
                    <div
                      role="status"
                      className="p-4 rounded-xl bg-[#FAF8F4] border border-[#1B4332]/30 space-y-2 text-sm"
                    >
                      <p className="font-medium text-[#1B4332]">
                        {submittedChangeRequest.requestType === 'cancel'
                          ? 'Cancellation request received'
                          : 'Rescheduling request received'}{' '}
                        ·{' '}
                        <span className="font-mono">{submittedChangeRequest.referenceCode}</span>
                      </p>
                      <p className="text-[#525753]">
                        We have notified {config.businessName} and will follow up with you shortly.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setSubmittedChangeRequest(null);
                          setChangeForm({
                            referenceCode: '',
                            phoneNumber: '',
                            requestType: 'reschedule',
                            requestedDate: getTodayDateString(),
                            requestedTime: PREFERRED_TIMES[0],
                            reason: '',
                          });
                        }}
                        className="text-xs font-medium text-[#1B4332] underline underline-offset-4 cursor-pointer"
                      >
                        Submit another request
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleChangeSubmit} noValidate className="space-y-4">
                      {changeSubmitError && (
                        <div
                          role="alert"
                          className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800"
                        >
                          {changeSubmitError}
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label
                            htmlFor="change-ref"
                            className="block text-xs font-medium text-[#222523] mb-1"
                          >
                            Booking Reference
                          </label>
                          <input
                            id="change-ref"
                            type="text"
                            value={changeForm.referenceCode}
                            onChange={(e) =>
                              setChangeForm({
                                ...changeForm,
                                referenceCode: e.target.value.toUpperCase(),
                              })
                            }
                            placeholder="e.g. LCC-A4F9K2"
                            className="w-full px-3 py-2 min-h-[42px] rounded-xl border border-[#DDD4C3] bg-white text-sm font-mono uppercase"
                          />
                          {changeErrors.referenceCode && (
                            <p className="mt-1 text-xs text-red-700">
                              {changeErrors.referenceCode}
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor="change-phone"
                            className="block text-xs font-medium text-[#222523] mb-1"
                          >
                            Phone Number Used When Booking
                          </label>
                          <input
                            id="change-phone"
                            type="tel"
                            value={changeForm.phoneNumber}
                            onChange={(e) =>
                              setChangeForm({ ...changeForm, phoneNumber: e.target.value })
                            }
                            placeholder="e.g. 07XX XXX XXX"
                            className="w-full px-3 py-2 min-h-[42px] rounded-xl border border-[#DDD4C3] bg-white text-sm tabular-nums"
                          />
                          {changeErrors.phoneNumber && (
                            <p className="mt-1 text-xs text-red-700">{changeErrors.phoneNumber}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        {(
                          [
                            { id: 'reschedule', label: 'Request Rescheduling' },
                            { id: 'cancel', label: 'Request Cancellation' },
                          ] as const
                        ).map((opt) => (
                          <label
                            key={opt.id}
                            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-medium cursor-pointer ${
                              changeForm.requestType === opt.id
                                ? 'border-[#1B4332] bg-[#DCE6DD]/60 text-[#1B4332]'
                                : 'border-[#DDD4C3] bg-white text-[#525753]'
                            }`}
                          >
                            <input
                              type="radio"
                              name="changeRequestType"
                              value={opt.id}
                              checked={changeForm.requestType === opt.id}
                              onChange={() =>
                                setChangeForm({ ...changeForm, requestType: opt.id })
                              }
                              className="accent-[#1B4332]"
                            />
                            <span>{opt.label}</span>
                          </label>
                        ))}
                      </div>

                      {changeForm.requestType === 'reschedule' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label
                              htmlFor="change-date"
                              className="block text-xs font-medium text-[#222523] mb-1"
                            >
                              New Preferred Date
                            </label>
                            <input
                              id="change-date"
                              type="date"
                              min={getTodayDateString()}
                              value={changeForm.requestedDate}
                              onChange={(e) =>
                                setChangeForm({ ...changeForm, requestedDate: e.target.value })
                              }
                              className="w-full px-3 py-2 min-h-[42px] rounded-xl border border-[#DDD4C3] bg-white text-sm tabular-nums"
                            />
                            {changeErrors.requestedDate && (
                              <p className="mt-1 text-xs text-red-700">
                                {changeErrors.requestedDate}
                              </p>
                            )}
                          </div>

                          <div>
                            <label
                              htmlFor="change-time"
                              className="block text-xs font-medium text-[#222523] mb-1"
                            >
                              New Preferred Time
                            </label>
                            <select
                              id="change-time"
                              value={changeForm.requestedTime}
                              onChange={(e) =>
                                setChangeForm({ ...changeForm, requestedTime: e.target.value })
                              }
                              className="w-full px-3 py-2 min-h-[42px] rounded-xl border border-[#DDD4C3] bg-white text-sm"
                            >
                              {PREFERRED_TIMES.map((slot) => (
                                <option key={slot} value={slot}>
                                  {slot}
                                </option>
                              ))}
                            </select>
                            {changeErrors.requestedTime && (
                              <p className="mt-1 text-xs text-red-700">
                                {changeErrors.requestedTime}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      <div>
                        <label
                          htmlFor="change-reason"
                          className="block text-xs font-medium text-[#222523] mb-1"
                        >
                          Note or Reason <span className="text-[#525753] font-normal">(Optional)</span>
                        </label>
                        <input
                          id="change-reason"
                          type="text"
                          value={changeForm.reason}
                          onChange={(e) => setChangeForm({ ...changeForm, reason: e.target.value })}
                          placeholder="Any helpful details regarding your request..."
                          className="w-full px-3 py-2 min-h-[42px] rounded-xl border border-[#DDD4C3] bg-white text-sm"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmittingChange}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[42px] text-xs sm:text-sm font-medium text-white bg-[#1B4332] hover:bg-[#143325] disabled:opacity-60 rounded-xl transition-colors cursor-pointer"
                      >
                        {isSubmittingChange && (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                        )}
                        <span>
                          {isSubmittingChange
                            ? 'Sending Request...'
                            : changeForm.requestType === 'cancel'
                              ? 'Submit Cancellation Request'
                              : 'Submit Reschedule Request'}
                        </span>
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
