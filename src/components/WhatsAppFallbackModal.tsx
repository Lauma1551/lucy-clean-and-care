import { Calendar, MessageCircle, X } from 'lucide-react';

interface WhatsAppFallbackModalProps {
  businessName: string;
  isOpen: boolean;
  onClose: () => void;
  onGoToBooking: () => void;
}

export function WhatsAppFallbackModal({
  businessName,
  isOpen,
  onClose,
  onGoToBooking,
}: WhatsAppFallbackModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="whatsapp-setup-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#222523]/45 backdrop-blur-xs"
    >
      <div className="w-full max-w-md bg-[#FAF8F4] rounded-2xl border border-[#DFD6C7] p-6 sm:p-7 shadow-lg">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-2.5 text-[#4F6F58]">
            <MessageCircle className="w-5 h-5" aria-hidden="true" />
            <span className="text-xs font-medium tracking-wide">WhatsApp Contact</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-[#525753] hover:bg-[#F1ECE3] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <h3 id="whatsapp-setup-title" className="font-display text-xl font-medium text-[#222523] mb-2">
          WhatsApp currently unavailable
        </h3>
        <p className="text-sm text-[#525753] leading-relaxed mb-6">
          {businessName} currently has no WhatsApp number configured. Please submit your cleaning
          request using our online booking form below.
        </p>

        <button
          type="button"
          onClick={() => {
            onClose();
            onGoToBooking();
          }}
          className="inline-flex items-center justify-center gap-2 w-full px-5 py-3 min-h-[44px] text-sm font-medium text-white bg-[#1B4332] hover:bg-[#143325] rounded-xl transition-colors cursor-pointer"
        >
          <Calendar className="w-4 h-4" aria-hidden="true" />
          <span>Submit Online Booking Request</span>
        </button>
      </div>
    </div>
  );
}
