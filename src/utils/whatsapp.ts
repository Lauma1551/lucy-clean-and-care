import type { BookingRecord } from '../shared/types.ts';

export function buildWhatsAppUrl(whatsappNumber: string, message: string): string | null {
  const digits = whatsappNumber.replace(/[^\d]/g, '');
  if (digits.length < 8) {
    return null;
  }
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${digits}?text=${encoded}`;
}

export function formatKesPrice(priceKes: number | null): string {
  if (priceKes === null || !Number.isFinite(priceKes)) {
    return 'Request a Quote';
  }
  return `KES ${new Intl.NumberFormat('en-KE', {
    maximumFractionDigits: 0,
  }).format(priceKes)}`;
}

export function buildBookingWhatsAppMessage(booking: BookingRecord, businessName = 'Lucy Clean & Care'): string {
  const lines = [
    `Hello ${businessName}, I would like to confirm my cleaning booking request.`,
    `Reference: ${booking.referenceCode}`,
    `Name: ${booking.fullName}`,
    `Phone: ${booking.phoneNumber}`,
  ];
  if (booking.email?.trim()) {
    lines.push(`Email: ${booking.email.trim()}`);
  }
  lines.push(
    `Location/Estate: ${booking.locationEstate}`,
    `House Size: ${booking.houseType}`,
    `Cleaning Type: ${booking.cleaningType}`,
    `Products Option: ${booking.productPreference}`,
    `Preferred Date: ${booking.preferredDate}`,
    `Preferred Time: ${booking.preferredTime}`
  );
  if (booking.instructions.trim()) {
    lines.push(`Instructions: ${booking.instructions.trim()}`);
  }
  return lines.join('\n');
}
