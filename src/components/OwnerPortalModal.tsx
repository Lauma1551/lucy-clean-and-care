import { onAuthStateChanged, type User } from 'firebase/auth';
import {
  CalendarClock,
  Check,
  Loader2,
  Lock,
  LogOut,
  MessageCircle,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash2,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  activeFirebaseError,
  auth,
  isFirebaseConfigured,
} from '../lib/firebase.ts';
import {
  deleteOwnerBooking,
  ensureInitialFirestoreSeed,
  extractReadableError,
  fetchOwnerBookings,
  fetchOwnerChangeRequests,
  isAuthorizedOwnerAccount,
  mapAuthErrorMessage,
  saveOwnerConfig,
  saveOwnerPricing,
  saveOwnerServices,
  signInOwnerWithGoogle,
  signOutOwner,
  triggerWhatsAppNotification,
  updateOwnerBookingDetails,
  updateOwnerChangeRequestStatus,
  verifyOwnerAccess,
} from '../lib/firestoreService.ts';
import { CLEANING_TYPES, DEFAULT_SERVICES, HOUSE_TYPES, PREFERRED_TIMES } from '../shared/defaults.ts';
import type {
  BookingChangeRequestRecord,
  BookingRecord,
  BookingStatus,
  PricingCategory,
  ServiceItem,
  SiteConfig,
  WhatsAppNotificationEvent,
} from '../shared/types.ts';
import { buildWhatsAppUrl, formatKesPrice } from '../utils/whatsapp.ts';

type OwnerTab = 'bookings' | 'pricing' | 'contact' | 'services';
type BookingFilter = 'all' | 'history' | BookingStatus;

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
  const [authReady, setAuthReady] = useState<boolean>(!isFirebaseConfigured);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthorizedOwner, setIsAuthorizedOwner] = useState<boolean>(false);
  const [accessDenied, setAccessDenied] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [changeRequests, setChangeRequests] = useState<BookingChangeRequestRecord[]>([]);
  const [bookingFilter, setBookingFilter] = useState<BookingFilter>('all');
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [pendingDeleteBookingId, setPendingDeleteBookingId] = useState<string | null>(null);
  const [reschedulingBookingId, setReschedulingBookingId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState<string>(PREFERRED_TIMES[0]);

  const [draftPricing, setDraftPricing] = useState<
    Array<{
      id: string;
      order: number;
      label: string;
      houseTypeValue: string;
      priceInput: string;
      note: string;
      updatedAt?: string;
    }>
  >([]);
  const [deletedPricingIds, setDeletedPricingIds] = useState<string[]>([]);
  const [draftConfig, setDraftConfig] = useState<SiteConfig>(config);
  const [draftServices, setDraftServices] = useState<ServiceItem[]>(services);
  const [deletedServiceIds, setDeletedServiceIds] = useState<string[]>([]);

  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    setDraftPricing(
      pricing.map((tier, idx) => ({
        id: tier.id,
        order: tier.order ?? idx + 1,
        label: tier.label,
        houseTypeValue: tier.houseTypeValue || HOUSE_TYPES[0],
        priceInput: tier.priceKes !== null ? String(tier.priceKes) : '',
        note: tier.note,
        updatedAt: tier.updatedAt,
      }))
    );
    setDeletedPricingIds([]);
  }, [pricing]);

  useEffect(() => {
    setDraftConfig(config);
  }, [config]);

  useEffect(() => {
    setDraftServices(services);
    setDeletedServiceIds([]);
  }, [services]);

  const loadBookings = useCallback(async () => {
    setBookingsLoading(true);
    setSaveError(null);
    try {
      const [list, requests] = await Promise.all([
        fetchOwnerBookings(),
        fetchOwnerChangeRequests().catch(() => [] as BookingChangeRequestRecord[]),
      ]);
      setBookings(list);
      setChangeRequests(requests);
    } catch (error) {
      setSaveError(
        extractReadableError(error, 'Could not load bookings from Cloud Firestore.')
      );
    } finally {
      setBookingsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!auth) {
      setAuthReady(true);
      setCurrentUser(null);
      setIsAuthorizedOwner(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setCurrentUser(null);
        setIsAuthorizedOwner(false);
        setBookings([]);
        setAuthReady(true);
        return;
      }

      if (!isAuthorizedOwnerAccount(user)) {
        await signOutOwner().catch(() => {});
        setCurrentUser(null);
        setIsAuthorizedOwner(false);
        setAccessDenied(true);
        setBookings([]);
        setAuthError(
          'Access denied. This Google account is not authorized to access the private owner area.'
        );
        setAuthReady(true);
        return;
      }

      setCurrentUser(user);
      setAuthError(null);
      setAccessDenied(false);
      setAuthLoading(true);
      try {
        const authorized = await verifyOwnerAccess();
        setIsAuthorizedOwner(authorized);
        if (!authorized) {
          await signOutOwner().catch(() => {});
          setCurrentUser(null);
          setAccessDenied(true);
          setBookings([]);
          setAuthError('Access denied. Owner verification failed in Cloud Firestore.');
        } else {
          const seeded = await ensureInitialFirestoreSeed().catch(() => null);
          if (seeded) {
            onDataUpdated({
              config: seeded.config,
              pricing: seeded.pricing,
              services: seeded.services,
            });
          }
        }
      } catch (error) {
        await signOutOwner().catch(() => {});
        setCurrentUser(null);
        setIsAuthorizedOwner(false);
        setAccessDenied(true);
        setAuthError(
          extractReadableError(error, 'Access denied. Could not verify owner permissions.')
        );
      } finally {
        setAuthLoading(false);
        setAuthReady(true);
      }
    });

    return () => unsubscribe();
  }, [onDataUpdated]);

  useEffect(() => {
    if (!isOpen || !isAuthorizedOwner || !isAuthorizedOwnerAccount(currentUser)) return;
    setSaveMessage(null);
    setSaveError(null);
    loadBookings();
  }, [isOpen, isAuthorizedOwner, currentUser, loadBookings]);

  const pendingCount = useMemo(
    () => bookings.filter((b) => b.status === 'pending').length,
    [bookings]
  );

  const filteredBookings = useMemo(() => {
    const queryText = bookingSearch.trim().toLowerCase();
    return bookings.filter((b) => {
      const matchesFilter =
        bookingFilter === 'all'
          ? true
          : bookingFilter === 'history'
            ? b.status === 'completed' || b.status === 'cancelled'
            : b.status === bookingFilter;
      if (!matchesFilter) return false;
      if (!queryText) return true;
      return (
        b.referenceCode.toLowerCase().includes(queryText) ||
        b.fullName.toLowerCase().includes(queryText) ||
        b.phoneNumber.toLowerCase().includes(queryText) ||
        b.locationEstate.toLowerCase().includes(queryText) ||
        b.cleaningType.toLowerCase().includes(queryText)
      );
    });
  }, [bookings, bookingFilter, bookingSearch]);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setAccessDenied(false);
    if (!isFirebaseConfigured) {
      setAuthError(
        activeFirebaseError || 'Firebase is not configured. Check your environment variables.'
      );
      return;
    }

    setAuthLoading(true);
    try {
      const result = await signInOwnerWithGoogle();
      if (!result.authorized) {
        setCurrentUser(null);
        setIsAuthorizedOwner(false);
        setAccessDenied(true);
        setBookings([]);
        setAuthError(
          `Access denied. ${result.email} is not authorized to access this dashboard.`
        );
      } else {
        setAccessDenied(false);
        setIsAuthorizedOwner(true);
        const seeded = await ensureInitialFirestoreSeed().catch(() => null);
        if (seeded) {
          onDataUpdated({
            config: seeded.config,
            pricing: seeded.pricing,
            services: seeded.services,
          });
        }
        await loadBookings();
      }
    } catch (error) {
      setAuthError(mapAuthErrorMessage(error));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    setAuthError(null);
    setSaveMessage(null);
    setSaveError(null);
    try {
      await signOutOwner();
      setCurrentUser(null);
      setIsAuthorizedOwner(false);
      setBookings([]);
    } catch (error) {
      setAuthError(mapAuthErrorMessage(error));
    }
  };

  const sendCustomerNotificationIfEligible = async (
    booking: BookingRecord,
    event: Extract<
      WhatsAppNotificationEvent,
      'customer_confirmed' | 'customer_rescheduled' | 'customer_cancelled'
    >,
    dateValue: string,
    timeValue: string
  ): Promise<{ sentKey?: string; note: string }> => {
    const dedupeKey =
      event === 'customer_cancelled'
        ? `customer_cancelled:${booking.referenceCode}`
        : `${event}:${booking.referenceCode}:${dateValue}:${timeValue}`;

    if (booking.sentNotificationKeys?.includes(dedupeKey)) {
      return { note: 'Duplicate customer WhatsApp notification skipped.' };
    }

    if (!booking.whatsappConsent) {
      return { note: 'Customer did not opt in to WhatsApp updates (not sent).' };
    }

    const res = await triggerWhatsAppNotification(
      {
        event,
        idempotencyKey: dedupeKey,
        referenceCode: booking.referenceCode,
        customerName: booking.fullName,
        customerPhone: booking.phoneNumber,
        locationEstate: booking.locationEstate,
        houseType: booking.houseType,
        cleaningType: booking.cleaningType,
        preferredDate: dateValue,
        preferredTime: timeValue,
        whatsappConsent: booking.whatsappConsent,
      },
      { requireOwnerAuth: true }
    );

    if (res.sent || res.status === 'deduplicated') {
      return {
        sentKey: dedupeKey,
        note: res.sent
          ? 'Customer notified via WhatsApp.'
          : 'Duplicate customer WhatsApp notification skipped.',
      };
    }

    return { note: `WhatsApp notice: ${res.message}` };
  };

  const handleUpdateBookingStatus = async (booking: BookingRecord, status: BookingStatus) => {
    setSaveError(null);
    setSaveMessage(null);
    try {
      let sentKey: string | undefined;
      let notifyNote = '';

      if (status === 'confirmed' && booking.status !== 'confirmed') {
        const notifyResult = await sendCustomerNotificationIfEligible(
          booking,
          'customer_confirmed',
          booking.preferredDate,
          booking.preferredTime
        );
        sentKey = notifyResult.sentKey;
        notifyNote = notifyResult.note;
      } else if (status === 'cancelled' && booking.status === 'confirmed') {
        const notifyResult = await sendCustomerNotificationIfEligible(
          booking,
          'customer_cancelled',
          booking.preferredDate,
          booking.preferredTime
        );
        sentKey = notifyResult.sentKey;
        notifyNote = notifyResult.note;
      }

      const updated = await updateOwnerBookingDetails(booking, {
        status,
        appendNotificationKey: sentKey,
      });

      setBookings((prev) => prev.map((b) => (b.id === booking.id ? updated : b)));
      setSaveMessage(
        notifyNote
          ? `Booking status updated to ${status}. ${notifyNote}`
          : 'Booking status updated in Firestore.'
      );
    } catch (error) {
      setSaveError(extractReadableError(error, 'Could not update booking status.'));
    }
  };

  const handleSaveReschedule = async (booking: BookingRecord) => {
    setSaveError(null);
    setSaveMessage(null);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(rescheduleDate) || !rescheduleTime.trim()) {
      setSaveError('Please enter a valid appointment date and time.');
      return;
    }

    try {
      let sentKey: string | undefined;
      let notifyNote = '';

      if (booking.status === 'confirmed') {
        const notifyResult = await sendCustomerNotificationIfEligible(
          booking,
          'customer_rescheduled',
          rescheduleDate,
          rescheduleTime
        );
        sentKey = notifyResult.sentKey;
        notifyNote = notifyResult.note;
      }

      const updated = await updateOwnerBookingDetails(booking, {
        preferredDate: rescheduleDate,
        preferredTime: rescheduleTime,
        appendNotificationKey: sentKey,
      });

      setBookings((prev) => prev.map((b) => (b.id === booking.id ? updated : b)));
      setReschedulingBookingId(null);
      setSaveMessage(
        notifyNote
          ? `Appointment updated in Firestore. ${notifyNote}`
          : 'Appointment date and time updated in Firestore.'
      );
    } catch (error) {
      setSaveError(extractReadableError(error, 'Could not update appointment schedule.'));
    }
  };

  const handleResolveChangeRequest = async (
    request: BookingChangeRequestRecord,
    action: 'apply_reschedule' | 'apply_cancel' | 'mark_reviewed'
  ) => {
    setSaveError(null);
    setSaveMessage(null);
    try {
      const matchingBooking = bookings.find(
        (b) => b.referenceCode.toUpperCase() === request.referenceCode.toUpperCase()
      );

      let notifyNote = '';

      if (action === 'apply_reschedule' && matchingBooking && request.requestedDate) {
        const nextTime = request.requestedTime || matchingBooking.preferredTime;
        let sentKey: string | undefined;
        if (matchingBooking.status === 'confirmed' || matchingBooking.status === 'pending') {
          const eventName: 'customer_confirmed' | 'customer_rescheduled' =
            matchingBooking.status === 'confirmed' ? 'customer_rescheduled' : 'customer_confirmed';
          const res = await sendCustomerNotificationIfEligible(
            matchingBooking,
            eventName,
            request.requestedDate,
            nextTime
          );
          sentKey = res.sentKey;
          notifyNote = res.note;
        }
        const updatedBooking = await updateOwnerBookingDetails(matchingBooking, {
          status: 'confirmed',
          preferredDate: request.requestedDate,
          preferredTime: nextTime,
          appendNotificationKey: sentKey,
        });
        setBookings((prev) =>
          prev.map((b) => (b.id === matchingBooking.id ? updatedBooking : b))
        );
        await updateOwnerChangeRequestStatus(request.id, 'completed');
        setChangeRequests((prev) =>
          prev.map((r) => (r.id === request.id ? { ...r, status: 'completed' } : r))
        );
        setSaveMessage(
          `Reschedule applied to ${request.referenceCode}. ${notifyNote}`.trim()
        );
        return;
      }

      if (action === 'apply_cancel' && matchingBooking) {
        let sentKey: string | undefined;
        if (matchingBooking.status === 'confirmed') {
          const res = await sendCustomerNotificationIfEligible(
            matchingBooking,
            'customer_cancelled',
            matchingBooking.preferredDate,
            matchingBooking.preferredTime
          );
          sentKey = res.sentKey;
          notifyNote = res.note;
        }
        const updatedBooking = await updateOwnerBookingDetails(matchingBooking, {
          status: 'cancelled',
          appendNotificationKey: sentKey,
        });
        setBookings((prev) =>
          prev.map((b) => (b.id === matchingBooking.id ? updatedBooking : b))
        );
        await updateOwnerChangeRequestStatus(request.id, 'completed');
        setChangeRequests((prev) =>
          prev.map((r) => (r.id === request.id ? { ...r, status: 'completed' } : r))
        );
        setSaveMessage(`Booking ${request.referenceCode} cancelled. ${notifyNote}`.trim());
        return;
      }

      await updateOwnerChangeRequestStatus(request.id, 'reviewed');
      setChangeRequests((prev) =>
        prev.map((r) => (r.id === request.id ? { ...r, status: 'reviewed' } : r))
      );
      setSaveMessage(`Request for ${request.referenceCode} marked as reviewed.`);
    } catch (error) {
      setSaveError(extractReadableError(error, 'Could not process change request.'));
    }
  };

  const handleDeleteBooking = async (id: string) => {
    setSaveError(null);
    setSaveMessage(null);
    try {
      await deleteOwnerBooking(id);
      setBookings((prev) => prev.filter((b) => b.id !== id));
      setPendingDeleteBookingId(null);
      setSaveMessage('Booking record removed from Firestore.');
    } catch (error) {
      setSaveError(extractReadableError(error, 'Could not delete booking record.'));
    }
  };

  const handleAddPricingRow = () => {
    const uniqueSuffix = Date.now().toString(36);
    setDraftPricing((prev) => [
      ...prev,
      {
        id: `tier-${uniqueSuffix}`,
        order: prev.length + 1,
        label: 'New Home Category',
        houseTypeValue: HOUSE_TYPES[0],
        priceInput: '',
        note: 'Custom residential cleaning quotation',
      },
    ]);
  };

  const handleRemovePricingRow = (id: string) => {
    setDraftPricing((prev) => prev.filter((item) => item.id !== id));
    setDeletedPricingIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const handleSavePricing = async (e: FormEvent) => {
    e.preventDefault();
    setSaveMessage(null);
    setSaveError(null);
    setIsSaving(true);

    try {
      const payload: PricingCategory[] = draftPricing.map((item, idx) => {
        const trimmed = item.priceInput.trim();
        const parsed = trimmed === '' ? null : Number(trimmed);
        return {
          id: item.id,
          order: idx + 1,
          label: item.label.trim() || 'Cleaning Tier',
          houseTypeValue: item.houseTypeValue || HOUSE_TYPES[0],
          priceKes:
            parsed !== null && Number.isFinite(parsed) && parsed >= 0
              ? Math.round(parsed)
              : null,
          note: item.note,
        };
      });

      const saved = await saveOwnerPricing(payload, deletedPricingIds);
      setDeletedPricingIds([]);
      onDataUpdated({ pricing: saved });
      setSaveMessage('Pricing saved to Cloud Firestore.');
    } catch (error) {
      setSaveError(extractReadableError(error, 'Could not save pricing changes.'));
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
      const saved = await saveOwnerConfig(draftConfig);
      onDataUpdated({ config: saved });
      setSaveMessage('Business, founder, and contact details saved to Cloud Firestore.');
    } catch (error) {
      setSaveError(extractReadableError(error, 'Could not save business details.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddServiceRow = () => {
    const uniqueSuffix = Date.now().toString(36);
    setDraftServices((prev) => [
      ...prev,
      {
        id: `service-${uniqueSuffix}`,
        order: prev.length + 1,
        title: 'New Cleaning Service',
        houseTypeValue: HOUSE_TYPES[0],
        cleaningTypeValue: CLEANING_TYPES[0],
        description: 'Detailed residential cleaning tailored to your home.',
        imageUrl: DEFAULT_SERVICES[0].imageUrl,
        available: true,
        pricingNote: 'Quoted in KES on request',
      },
    ]);
  };

  const handleRemoveServiceRow = (id: string) => {
    setDraftServices((prev) => prev.filter((item) => item.id !== id));
    setDeletedServiceIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const handleSaveServices = async (e: FormEvent) => {
    e.preventDefault();
    setSaveMessage(null);
    setSaveError(null);
    setIsSaving(true);

    try {
      const saved = await saveOwnerServices(draftServices, deletedServiceIds);
      setDeletedServiceIds([]);
      onDataUpdated({ services: saved });
      setSaveMessage('Cleaning services updated in Cloud Firestore.');
    } catch (error) {
      setSaveError(extractReadableError(error, 'Could not save service updates.'));
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
            {currentUser && (
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
          {!isFirebaseConfigured ? (
            <div className="max-w-lg mx-auto py-8 space-y-4">
              <div className="w-11 h-11 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="font-display text-2xl font-medium text-[#222523]">
                Firebase Configuration Required
              </h3>
              <p className="text-sm text-[#525753] leading-relaxed">
                {activeFirebaseError ||
                  'Firebase Authentication and Cloud Firestore environment variables are missing.'}
              </p>
              <p className="text-xs text-[#525753] leading-relaxed bg-[#F4EFE6] p-4 rounded-xl border border-[#DDD4C3]">
                Add <code className="font-mono">VITE_FIREBASE_API_KEY</code>,{' '}
                <code className="font-mono">VITE_FIREBASE_AUTH_DOMAIN</code>,{' '}
                <code className="font-mono">VITE_FIREBASE_PROJECT_ID</code>, and{' '}
                <code className="font-mono">VITE_FIREBASE_APP_ID</code> in Netlify Site
                Configuration -&gt; Environment Variables and redeploy.
              </p>
            </div>
          ) : !authReady ? (
            <div className="py-16 flex items-center justify-center gap-2 text-sm text-[#525753]">
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              <span>Checking owner session...</span>
            </div>
          ) : !currentUser || !isAuthorizedOwner || !isAuthorizedOwnerAccount(currentUser) ? (
            <div className="max-w-md mx-auto py-8">
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center mb-4 ${
                  accessDenied
                    ? 'bg-red-100 text-red-800'
                    : 'bg-[#DCE6DD] text-[#1B4332]'
                }`}
              >
                {accessDenied ? (
                  <ShieldAlert className="w-5 h-5" aria-hidden="true" />
                ) : (
                  <Lock className="w-5 h-5" aria-hidden="true" />
                )}
              </div>
              <h3 className="font-display text-2xl font-medium text-[#222523] mb-2">
                {accessDenied ? 'Access Denied' : 'Restricted Owner Access'}
              </h3>
              <p className="text-sm text-[#525753] leading-relaxed mb-6">
                {accessDenied
                  ? `Only the specifically authorized ${config.businessName} owner account is permitted to access this area.`
                  : `This private page is restricted to the authorized ${config.businessName} owner. Customer bookings and enquiries are handled on the main website.`}
              </p>

              {authError && (
                <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800">
                  {authError}
                </div>
              )}

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={authLoading}
                  className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3 min-h-[46px] text-sm font-medium text-white bg-[#1B4332] hover:bg-[#143325] disabled:opacity-60 rounded-xl transition-colors cursor-pointer"
                >
                  {authLoading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                  <span>
                    {authLoading
                      ? 'Verifying...'
                      : accessDenied
                        ? 'Sign In with Authorized Account'
                        : 'Owner Google Sign-In'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full inline-flex items-center justify-center px-5 py-3 min-h-[44px] text-sm font-medium text-[#1B4332] bg-[#F4EFE6] hover:bg-[#E9E2D4] border border-[#DDD4C3] rounded-xl transition-colors cursor-pointer"
                >
                  Return to Website
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* Signed-in Banner */}
              <div className="mb-5 flex flex-wrap items-center justify-between gap-2 text-xs text-[#525753]">
                <span>
                  Signed in as <strong className="text-[#222523]">{currentUser.email}</strong>
                </span>
                {pendingCount > 0 && (
                  <span className="font-medium text-[#1B4332]">
                    {pendingCount} pending booking{pendingCount === 1 ? '' : 's'} awaiting review
                  </span>
                )}
              </div>

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
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {(
                          [
                            { id: 'all', label: `All (${bookings.length})` },
                            {
                              id: 'pending',
                              label: `Pending (${bookings.filter((b) => b.status === 'pending').length})`,
                            },
                            {
                              id: 'confirmed',
                              label: `Confirmed (${bookings.filter((b) => b.status === 'confirmed').length})`,
                            },
                            {
                              id: 'completed',
                              label: `Completed (${bookings.filter((b) => b.status === 'completed').length})`,
                            },
                            {
                              id: 'cancelled',
                              label: `Cancelled (${bookings.filter((b) => b.status === 'cancelled').length})`,
                            },
                            {
                              id: 'history',
                              label: `History (${bookings.filter((b) => b.status === 'completed' || b.status === 'cancelled').length})`,
                            },
                          ] as const
                        ).map((filterOption) => (
                          <button
                            key={filterOption.id}
                            type="button"
                            onClick={() => setBookingFilter(filterOption.id)}
                            className={`px-3 py-1.5 min-h-[34px] text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                              bookingFilter === filterOption.id
                                ? 'bg-[#1B4332] text-white border-[#1B4332]'
                                : 'bg-white text-[#525753] border-[#DFD6C7] hover:border-[#1B4332]'
                            }`}
                          >
                            {filterOption.label}
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={loadBookings}
                        disabled={bookingsLoading}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[34px] text-xs font-medium text-[#1B4332] bg-white hover:bg-[#F4EFE6] border border-[#DFD6C7] rounded-lg cursor-pointer"
                      >
                        <RefreshCw
                          className={`w-3.5 h-3.5 ${bookingsLoading ? 'animate-spin' : ''}`}
                          aria-hidden="true"
                        />
                        <span>Refresh</span>
                      </button>
                    </div>

                    <div className="relative">
                      <Search
                        className="w-4 h-4 text-[#525753] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                        aria-hidden="true"
                      />
                      <input
                        type="search"
                        value={bookingSearch}
                        onChange={(e) => setBookingSearch(e.target.value)}
                        placeholder="Search bookings by reference code, customer name, phone, or estate..."
                        aria-label="Search bookings"
                        className="w-full pl-9 pr-3.5 py-2 min-h-[40px] rounded-xl border border-[#DFD6C7] bg-white text-sm text-[#222523] placeholder:text-[#525753]/70 focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
                      />
                    </div>
                  </div>

                  {changeRequests.some((r) => r.status === 'pending') && (
                    <div className="p-4 rounded-xl border border-[#1B4332]/25 bg-[#F4EFE6]/80 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-medium text-[#1B4332]">
                        <CalendarClock className="w-4 h-4" aria-hidden="true" />
                        <span>
                          Customer Reschedule &amp; Cancellation Requests (
                          {changeRequests.filter((r) => r.status === 'pending').length} pending)
                        </span>
                      </div>
                      <div className="space-y-2.5">
                        {changeRequests
                          .filter((r) => r.status === 'pending')
                          .map((req) => {
                            const matched = bookings.find(
                              (b) =>
                                b.referenceCode.toUpperCase() === req.referenceCode.toUpperCase()
                            );
                            return (
                              <div
                                key={req.id}
                                className="p-3.5 rounded-xl bg-white border border-[#DDD4C3] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                              >
                                <div className="space-y-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-mono font-semibold text-[#1B4332]">
                                      {req.referenceCode}
                                    </span>
                                    <span className="font-medium text-[#222523]">
                                      {req.requestType === 'cancel'
                                        ? 'Cancellation Request'
                                        : 'Reschedule Request'}
                                    </span>
                                    <span className="text-[#525753] tabular-nums">
                                      · {req.phoneNumber}
                                    </span>
                                  </div>
                                  {req.requestType === 'reschedule' && (
                                    <p className="text-[#222523]">
                                      Requested: <strong>{req.requestedDate}</strong> ·{' '}
                                      {req.requestedTime}
                                    </p>
                                  )}
                                  {req.reason && (
                                    <p className="text-[#525753]">Note: {req.reason}</p>
                                  )}
                                </div>

                                <div className="flex flex-wrap items-center gap-2 shrink-0">
                                  {matched && req.requestType === 'reschedule' && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleResolveChangeRequest(req, 'apply_reschedule')
                                      }
                                      className="px-3 py-1.5 min-h-[34px] text-xs font-medium text-white bg-[#1B4332] hover:bg-[#143325] rounded-lg cursor-pointer"
                                    >
                                      Apply &amp; Notify
                                    </button>
                                  )}
                                  {matched && req.requestType === 'cancel' && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleResolveChangeRequest(req, 'apply_cancel')
                                      }
                                      className="px-3 py-1.5 min-h-[34px] text-xs font-medium text-white bg-red-700 hover:bg-red-800 rounded-lg cursor-pointer"
                                    >
                                      Cancel Booking
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleResolveChangeRequest(req, 'mark_reviewed')
                                    }
                                    className="px-3 py-1.5 min-h-[34px] text-xs font-medium text-[#525753] bg-[#F4EFE6] hover:bg-[#E7E0D3] rounded-lg cursor-pointer"
                                  >
                                    Mark Reviewed
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {bookingsLoading ? (
                    <div className="py-12 flex items-center justify-center text-sm text-[#525753] gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                      <span>Loading booking requests...</span>
                    </div>
                  ) : filteredBookings.length === 0 ? (
                    <div className="py-12 text-center bg-[#F1ECE3]/50 rounded-xl border border-[#DFD6C7] px-6">
                      <p className="font-display text-lg text-[#222523] mb-1">
                        {bookingFilter === 'all'
                          ? 'No booking requests yet'
                          : `No ${bookingFilter} bookings`}
                      </p>
                      <p className="text-sm text-[#525753]">
                        Customer booking submissions from the website will appear here automatically.
                      </p>
                    </div>
                  ) : (
                    filteredBookings.map((booking) => {
                      const replyUrl = buildWhatsAppUrl(
                        booking.phoneNumber.startsWith('0')
                          ? `254${booking.phoneNumber.slice(1)}`
                          : booking.phoneNumber,
                        `Hello ${booking.fullName}, thank you for contacting ${config.businessName} regarding your ${booking.houseType} cleaning request (${booking.referenceCode}).`
                      );
                      const isConfirmingDelete = pendingDeleteBookingId === booking.id;
                      const isRescheduling = reschedulingBookingId === booking.id;
                      return (
                        <div
                          key={booking.id}
                          className="p-5 rounded-xl border border-[#DFD6C7] bg-white space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[#DCE6DD]/70 text-[#1B4332]">
                                  {booking.referenceCode}
                                </span>
                                <span className="text-xs font-medium text-[#4F6F58] tabular-nums">
                                  {booking.preferredDate} ({booking.preferredTime})
                                </span>
                              </div>
                              <h4 className="font-display text-lg font-medium text-[#222523]">
                                {booking.fullName}
                              </h4>
                              <p className="text-xs text-[#525753]">
                                Submitted:{' '}
                                {new Date(booking.createdAt).toLocaleString('en-KE', {
                                  dateStyle: 'medium',
                                  timeStyle: 'short',
                                })}{' '}
                                ·{' '}
                                <span
                                  className={
                                    booking.whatsappConsent
                                      ? 'text-[#1B4332] font-medium'
                                      : 'text-[#525753]'
                                  }
                                >
                                  {booking.whatsappConsent
                                    ? 'WhatsApp Updates: Opted In'
                                    : 'WhatsApp Updates: No Opt-In'}
                                </span>
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              {booking.status === 'pending' && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateBookingStatus(booking, 'confirmed')}
                                  className="px-3 py-1.5 min-h-[38px] text-xs font-medium text-[#1B4332] bg-[#DCE6DD] hover:bg-[#c8dac9] rounded-lg transition-colors cursor-pointer"
                                >
                                  Confirm
                                </button>
                              )}
                              {booking.status === 'confirmed' && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateBookingStatus(booking, 'completed')}
                                  className="px-3 py-1.5 min-h-[38px] text-xs font-medium text-[#1B4332] bg-[#DCE6DD] hover:bg-[#c8dac9] rounded-lg transition-colors cursor-pointer"
                                >
                                  Mark Completed
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  if (isRescheduling) {
                                    setReschedulingBookingId(null);
                                  } else {
                                    setReschedulingBookingId(booking.id);
                                    setRescheduleDate(booking.preferredDate);
                                    setRescheduleTime(booking.preferredTime || PREFERRED_TIMES[0]);
                                  }
                                }}
                                className="px-3 py-1.5 min-h-[38px] text-xs font-medium text-[#525753] hover:text-[#1B4332] bg-[#FAF8F4] border border-[#DFD6C7] rounded-lg transition-colors cursor-pointer"
                              >
                                {isRescheduling ? 'Close Edit' : 'Reschedule'}
                              </button>
                              <select
                                aria-label={`Status for ${booking.fullName}`}
                                value={booking.status}
                                onChange={(e) =>
                                  handleUpdateBookingStatus(
                                    booking,
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
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[38px] text-xs font-medium text-white bg-[#1B4332] hover:bg-[#143325] rounded-lg transition-colors whitespace-nowrap"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
                                  <span>Message</span>
                                </a>
                              )}

                              {isConfirmingDelete ? (
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteBooking(booking.id)}
                                    className="px-2.5 py-1.5 min-h-[38px] text-xs font-medium text-white bg-red-700 hover:bg-red-800 rounded-lg cursor-pointer"
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setPendingDeleteBookingId(null)}
                                    className="px-2.5 py-1.5 min-h-[38px] text-xs font-medium text-[#525753] bg-[#F4EFE6] rounded-lg cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setPendingDeleteBookingId(booking.id)}
                                  aria-label={`Delete booking ${booking.referenceCode}`}
                                  className="inline-flex items-center justify-center w-9 h-9 text-[#525753] hover:text-red-700 rounded-lg border border-[#DFD6C7] hover:border-red-200 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                                </button>
                              )}
                            </div>
                          </div>

                          {isRescheduling && (
                            <div className="p-3.5 rounded-xl bg-[#FAF8F4] border border-[#DFD6C7] grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                              <div className="sm:col-span-4">
                                <label className="block text-xs text-[#525753] mb-1">
                                  Appointment Date
                                </label>
                                <input
                                  type="date"
                                  value={rescheduleDate}
                                  onChange={(e) => setRescheduleDate(e.target.value)}
                                  className="w-full px-3 py-2 min-h-[38px] rounded-lg border border-[#DFD6C7] bg-white text-xs tabular-nums"
                                />
                              </div>
                              <div className="sm:col-span-5">
                                <label className="block text-xs text-[#525753] mb-1">
                                  Appointment Time
                                </label>
                                <select
                                  value={rescheduleTime}
                                  onChange={(e) => setRescheduleTime(e.target.value)}
                                  className="w-full px-3 py-2 min-h-[38px] rounded-lg border border-[#DFD6C7] bg-white text-xs"
                                >
                                  {PREFERRED_TIMES.map((slot) => (
                                    <option key={slot} value={slot}>
                                      {slot}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="sm:col-span-3">
                                <button
                                  type="button"
                                  onClick={() => handleSaveReschedule(booking)}
                                  className="w-full px-3 py-2 min-h-[38px] text-xs font-medium text-white bg-[#1B4332] hover:bg-[#143325] rounded-lg cursor-pointer"
                                >
                                  Save Schedule
                                </button>
                              </div>
                            </div>
                          )}

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

                          {booking.email && (
                            <p className="text-xs sm:text-sm text-[#525753]">
                              <span className="font-medium text-[#222523]">Email:</span>{' '}
                              {booking.email}
                            </p>
                          )}

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
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <p className="text-sm text-[#525753]">
                      Enter amounts in Kenyan Shillings (KES), or leave the price field empty to
                      display &ldquo;Request a Quote&rdquo;.
                    </p>
                    <button
                      type="button"
                      onClick={handleAddPricingRow}
                      className="inline-flex items-center gap-1.5 self-start px-3.5 py-2 min-h-[38px] text-xs font-medium text-[#1B4332] bg-white hover:bg-[#F4EFE6] border border-[#DFD6C7] rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Add Pricing Row</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {draftPricing.map((tier, idx) => (
                      <div
                        key={tier.id}
                        className="p-4 rounded-xl border border-[#DFD6C7] bg-white space-y-3"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                          <div className="sm:col-span-4">
                            <label className="block text-xs text-[#525753] mb-1">
                              Category Label
                            </label>
                            <input
                              type="text"
                              value={tier.label}
                              onChange={(e) => {
                                const next = [...draftPricing];
                                next[idx] = { ...tier, label: e.target.value };
                                setDraftPricing(next);
                              }}
                              className="w-full px-3 py-2 min-h-[40px] rounded-lg border border-[#DFD6C7] text-sm font-medium"
                            />
                          </div>

                          <div className="sm:col-span-4">
                            <label className="block text-xs text-[#525753] mb-1">
                              House Type Mapping
                            </label>
                            <select
                              value={tier.houseTypeValue}
                              onChange={(e) => {
                                const next = [...draftPricing];
                                next[idx] = { ...tier, houseTypeValue: e.target.value };
                                setDraftPricing(next);
                              }}
                              className="w-full px-3 py-2 min-h-[40px] rounded-lg border border-[#DFD6C7] text-sm bg-white"
                            >
                              {HOUSE_TYPES.map((ht) => (
                                <option key={ht} value={ht}>
                                  {ht}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="sm:col-span-3">
                            <label className="block text-xs text-[#525753] mb-1">
                              Price (KES)
                            </label>
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

                          <div className="sm:col-span-1 flex justify-end">
                            {draftPricing.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemovePricingRow(tier.id)}
                                aria-label={`Remove ${tier.label}`}
                                className="inline-flex items-center justify-center w-10 h-10 text-[#525753] hover:text-red-700 rounded-lg border border-[#DFD6C7] hover:border-red-200 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" aria-hidden="true" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                          <div className="sm:col-span-8">
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
                          <div className="sm:col-span-4 text-xs text-[#525753] sm:text-right pt-2 sm:pt-4">
                            Preview:{' '}
                            <strong className="text-[#1B4332] tabular-nums">
                              {formatKesPrice(
                                tier.priceInput.trim() ? Number(tier.priceInput) : null
                              )}
                            </strong>
                            {tier.updatedAt && (
                              <span className="block text-[11px] text-[#525753] mt-0.5">
                                Updated {new Date(tier.updatedAt).toLocaleDateString('en-KE')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] text-sm font-medium text-white bg-[#1B4332] hover:bg-[#143325] rounded-xl cursor-pointer"
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
                      About the Founder Biography
                    </label>
                    <textarea
                      rows={6}
                      value={draftConfig.founderBio}
                      onChange={(e) =>
                        setDraftConfig({ ...draftConfig, founderBio: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFD6C7] bg-white text-sm leading-relaxed"
                    />
                    <p className="text-xs text-[#525753] mt-1">
                      Separate paragraphs with a blank line. Displayed directly in the Meet the
                      Founder section.
                    </p>
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
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] text-sm font-medium text-white bg-[#1B4332] hover:bg-[#143325] rounded-xl cursor-pointer"
                  >
                    {isSaving && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                    <span>Save Business Details</span>
                  </button>
                </form>
              )}

              {/* Tab 4: Services */}
              {activeTab === 'services' && (
                <form onSubmit={handleSaveServices} className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <p className="text-sm text-[#525753]">
                      Update service names, descriptions, availability, and quotation notes shown
                      on the homepage.
                    </p>
                    <button
                      type="button"
                      onClick={handleAddServiceRow}
                      className="inline-flex items-center gap-1.5 self-start px-3.5 py-2 min-h-[38px] text-xs font-medium text-[#1B4332] bg-white hover:bg-[#F4EFE6] border border-[#DFD6C7] rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Add Service</span>
                    </button>
                  </div>

                  {draftServices.map((service, idx) => (
                    <div
                      key={service.id}
                      className="p-4 rounded-xl border border-[#DFD6C7] bg-white space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <input
                          type="text"
                          value={service.title}
                          onChange={(e) => {
                            const next = [...draftServices];
                            next[idx] = { ...service, title: e.target.value };
                            setDraftServices(next);
                          }}
                          className="flex-1 px-3 py-2 min-h-[40px] rounded-lg border border-[#DFD6C7] text-sm font-medium"
                        />
                        <div className="flex items-center gap-3 shrink-0">
                          <label className="inline-flex items-center gap-2 text-xs font-medium text-[#222523] cursor-pointer">
                            <input
                              type="checkbox"
                              checked={service.available !== false}
                              onChange={(e) => {
                                const next = [...draftServices];
                                next[idx] = { ...service, available: e.target.checked };
                                setDraftServices(next);
                              }}
                              className="accent-[#1B4332]"
                            />
                            <span>Available on website</span>
                          </label>
                          {draftServices.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveServiceRow(service.id)}
                              aria-label={`Remove ${service.title}`}
                              className="inline-flex items-center justify-center w-9 h-9 text-[#525753] hover:text-red-700 rounded-lg border border-[#DFD6C7] hover:border-red-200 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                          )}
                        </div>
                      </div>

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

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs text-[#525753] mb-1">
                            Default House Size
                          </label>
                          <select
                            value={service.houseTypeValue}
                            onChange={(e) => {
                              const next = [...draftServices];
                              next[idx] = { ...service, houseTypeValue: e.target.value };
                              setDraftServices(next);
                            }}
                            className="w-full px-3 py-2 min-h-[38px] rounded-lg border border-[#DFD6C7] text-xs bg-white"
                          >
                            {HOUSE_TYPES.map((ht) => (
                              <option key={ht} value={ht}>
                                {ht}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs text-[#525753] mb-1">
                            Cleaning Category
                          </label>
                          <select
                            value={service.cleaningTypeValue}
                            onChange={(e) => {
                              const next = [...draftServices];
                              next[idx] = { ...service, cleaningTypeValue: e.target.value };
                              setDraftServices(next);
                            }}
                            className="w-full px-3 py-2 min-h-[38px] rounded-lg border border-[#DFD6C7] text-xs bg-white"
                          >
                            {CLEANING_TYPES.map((ct) => (
                              <option key={ct} value={ct}>
                                {ct}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs text-[#525753] mb-1">
                            Pricing / Quotation Note
                          </label>
                          <input
                            type="text"
                            value={service.pricingNote || ''}
                            onChange={(e) => {
                              const next = [...draftServices];
                              next[idx] = { ...service, pricingNote: e.target.value };
                              setDraftServices(next);
                            }}
                            placeholder="e.g. Quoted in KES based on condition"
                            className="w-full px-3 py-2 min-h-[38px] rounded-lg border border-[#DFD6C7] text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] text-sm font-medium text-white bg-[#1B4332] hover:bg-[#143325] rounded-xl cursor-pointer"
                  >
                    {isSaving && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                    <span>Save Service Updates</span>
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
