import { ArrowLeft, Mail, MapPin, MessageCircle, Phone, ShieldCheck } from 'lucide-react';
import type { SiteConfig } from '../shared/types.ts';

interface LegalPageProps {
  config: SiteConfig;
  onBackHome: () => void;
  onNavigate: (path: string) => void;
  onWhatsAppClick: () => void;
}

function LegalDocumentShell({
  eyebrow,
  title,
  subtitle,
  lastUpdated,
  onBackHome,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  lastUpdated: string;
  onBackHome: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-[#FAF8F4] border-b border-[#DDD4C3]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <button
            type="button"
            onClick={onBackHome}
            className="inline-flex items-center gap-2 px-4 py-2 min-h-[40px] text-sm font-medium text-[#1B4332] bg-[#F4EFE6] hover:bg-[#E9E2D4] border border-[#DDD4C3] rounded-xl transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4332]"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Back to Home</span>
          </button>
        </div>

        <header className="pb-8 mb-10 border-b border-[#DDD4C3]">
          <p className="text-xs font-medium tracking-wide text-[#1B4332] mb-2.5">{eyebrow}</p>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-[#222523] [text-wrap:balance] mb-4">
            {title}
          </h1>
          <p className="text-base sm:text-[17px] text-[#4E544F] leading-relaxed max-w-2xl mb-4">
            {subtitle}
          </p>
          <p className="text-xs text-[#4F6F58] font-medium">Effective date: {lastUpdated}</p>
        </header>

        <div className="space-y-8 text-[15px] sm:text-base text-[#3B3F3C] leading-relaxed">
          {children}
        </div>

        <div className="mt-12 pt-8 border-t border-[#DDD4C3] flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBackHome}
            className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] text-sm font-medium text-white bg-[#1B4332] hover:bg-[#143325] rounded-xl shadow-[0_8px_18px_-8px_rgba(27,67,50,0.45)] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4332]"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Return to Homepage</span>
          </button>
        </div>
      </div>
    </section>
  );
}

function PolicyBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="bg-[#F4EFE6]/60 rounded-2xl border border-[#DDD4C3] p-6 sm:p-7 space-y-3">
      <h2 className="font-display text-xl sm:text-2xl font-medium text-[#222523]">{title}</h2>
      <div className="space-y-3 text-sm sm:text-[15px] text-[#3B3F3C] leading-relaxed">
        {children}
      </div>
    </article>
  );
}

function VerifiedContactCard({
  config,
  onWhatsAppClick,
}: {
  config: SiteConfig;
  onWhatsAppClick: () => void;
}) {
  return (
    <div className="bg-[#FAF8F4] rounded-xl border border-[#DDD4C3] p-5 space-y-2.5 text-sm">
      <p className="font-display text-base font-medium text-[#222523]">{config.businessName}</p>
      <p className="text-[#525753] flex items-center gap-2">
        <MapPin className="w-4 h-4 text-[#1B4332] shrink-0" aria-hidden="true" />
        <span>
          {config.city} ({config.serviceAreas})
        </span>
      </p>
      {config.telephone && (
        <p className="text-[#525753] flex items-center gap-2">
          <Phone className="w-4 h-4 text-[#1B4332] shrink-0" aria-hidden="true" />
          <a
            href={`tel:${config.telephone.replace(/\s+/g, '')}`}
            className="text-[#1B4332] hover:underline underline-offset-4 tabular-nums"
          >
            {config.telephone}
          </a>
        </p>
      )}
      {config.email && (
        <p className="text-[#525753] flex items-center gap-2">
          <Mail className="w-4 h-4 text-[#1B4332] shrink-0" aria-hidden="true" />
          <a
            href={`mailto:${config.email}`}
            className="text-[#1B4332] hover:underline underline-offset-4 break-all"
          >
            {config.email}
          </a>
        </p>
      )}
      <div className="pt-2">
        <button
          type="button"
          onClick={onWhatsAppClick}
          className="inline-flex items-center gap-2 px-4 py-2 min-h-[38px] text-xs font-medium text-white bg-[#1B4332] hover:bg-[#143325] rounded-lg transition-colors cursor-pointer"
        >
          <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Contact Us on WhatsApp</span>
        </button>
      </div>
    </div>
  );
}

export function PrivacyPolicyPage({
  config,
  onBackHome,
  onNavigate,
  onWhatsAppClick,
}: LegalPageProps) {
  return (
    <LegalDocumentShell
      eyebrow="Legal & Privacy"
      title="Privacy Policy"
      subtitle={`How ${config.businessName} collects, stores, protects, and handles your personal information in accordance with Kenya's Data Protection Act, 2019.`}
      lastUpdated="November 2026"
      onBackHome={onBackHome}
    >
      <PolicyBlock title="1. Who We Are">
        <p>
          <strong>{config.businessName}</strong> is a founder-led residential and domestic cleaning
          business founded by {config.founderName}, serving {config.serviceAreas} from{' '}
          {config.city}. This Privacy Policy explains how we handle personal information submitted
          through our website and online booking form.
        </p>
      </PolicyBlock>

      <PolicyBlock title="2. Personal Information We Collect">
        <p>
          When you submit a cleaning request through our online booking form, we collect only the
          information needed to evaluate, quote, schedule, and carry out your cleaning service:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong>Contact details:</strong> Your full name, phone number, and optional email
            address.
          </li>
          <li>
            <strong>Property &amp; location details:</strong> Your estate or neighbourhood (such as
            Roysambu or nearby estates in Nairobi) and house size (bedsitter, one-bedroom,
            two-bedroom, three-bedroom, or four-bedroom and above).
          </li>
          <li>
            <strong>Service preferences:</strong> Requested cleaning type, preferred date and time
            window, cleaning products preference (whether {config.businessName} brings supplies or
            you provide them), and any optional instructions you choose to share (such as estate
            gate access notes, pets, or room focus).
          </li>
          <li>
            <strong>Booking administration records:</strong> A generated booking reference code
            (e.g., <code className="font-mono text-xs">LCC-XXXXXX</code>), optional WhatsApp
            notification consent preference, rescheduling/cancellation requests, booking status, and
            submission/update timestamps.
          </li>
        </ul>
        <p>
          If you opt in to WhatsApp booking notifications or contact us via WhatsApp, booking
          confirmations, schedule updates, or cancellation notices may be sent through the WhatsApp
          Business Platform and are also subject to WhatsApp&apos;s own terms and privacy policy.
        </p>
      </PolicyBlock>

      <PolicyBlock title="3. Why We Collect Customer Information">
        <p>We use your personal information solely to:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Review your home cleaning request and prepare an accurate quotation in KES.</li>
          <li>Contact you by phone, WhatsApp, or email to confirm scheduling and arrival details.</li>
          <li>Coordinate and deliver the requested residential cleaning service.</li>
          <li>Manage rescheduling, cancellations, customer follow-up, and booking records.</li>
          <li>Respond to questions, feedback, or privacy requests.</li>
        </ul>
      </PolicyBlock>

      <PolicyBlock title="4. Storage, Infrastructure & Third-Party Service Providers">
        <p>
          Our website uses trusted third-party cloud infrastructure providers to host the site and
          manage booking data:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong>Netlify (Website Hosting):</strong> Hosts and delivers the static website pages.
            As part of standard web delivery, Netlify may process basic technical request logs
            (such as IP address and browser user-agent metadata).
          </li>
          <li>
            <strong>Google Firebase (Cloud Firestore &amp; Firebase Authentication):</strong>{' '}
            Customer booking requests submitted through the website form are stored in Google Cloud
            Firestore. Access to the administrative dashboard is protected using Firebase
            Authentication.
          </li>
        </ul>
        <p>
          Because Netlify and Google Firebase operate global cloud infrastructure, booking
          information submitted through this website may be transferred to, processed, and stored on
          servers located outside Kenya. We do not sell, rent, or trade your personal information to
          third parties for marketing or advertising.
        </p>
        <p>
          We do not place unnecessary advertising cookies or third-party analytics trackers on this
          website. Firebase Authentication uses browser storage strictly to maintain an authorised
          owner&apos;s sign-in session on the administrative dashboard.
        </p>
      </PolicyBlock>

      <PolicyBlock title="5. Access Restrictions & Security Measures">
        <div className="flex items-start gap-3 p-4 rounded-xl bg-[#FAF8F4] border border-[#DDD4C3]">
          <ShieldCheck className="w-5 h-5 text-[#1B4332] shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-sm text-[#3B3F3C]">
            Communication between your browser, Netlify, and Google Firebase occurs over HTTPS.
            Cloud Firestore security rules enforce strict access controls: public website visitors
            can submit a new booking request, but <strong>cannot read, view, modify, or delete</strong>{' '}
            other customers&apos; bookings. Only authorised {config.businessName} owner accounts
            verified through Firebase Authentication can access and manage stored bookings.
          </p>
        </div>
        <p>
          While we apply access restrictions and industry-standard cloud transport security, no
          online transmission or cloud storage system can be guaranteed completely immune from risk.
        </p>
      </PolicyBlock>

      <PolicyBlock title="6. Data Retention">
        <p>
          Customer booking records remain stored in Cloud Firestore for as long as reasonably
          necessary to manage your appointment, keep service history for follow-up or customer
          support, and meet any applicable administrative or legal requirements. Records are not
          automatically deleted on a fixed timer; instead, they are removed manually by an
          authorised owner when no longer required or following a verified deletion request from you.
        </p>
      </PolicyBlock>

      <PolicyBlock title="7. When Information May Be Shared">
        <p>We only share personal information in limited circumstances:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            With technical infrastructure providers named in Section 4 strictly to host the website
            and store booking data.
          </li>
          <li>
            With cleaning staff assigned to your confirmed booking, limited to the name, phone
            number, location/estate, and access instructions required to complete the visit.
          </li>
          <li>
            Where disclosure is required by Kenyan law, a court order, or a lawful regulatory
            request.
          </li>
        </ul>
      </PolicyBlock>

      <PolicyBlock title="8. Your Rights Under Kenya's Data Protection Act, 2019">
        <p>
          Under Kenya&apos;s <strong>Data Protection Act, 2019</strong>, you have the right to:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Be informed about how your personal data is being collected and used.</li>
          <li>Request access to the personal data we hold about you.</li>
          <li>Request correction of inaccurate, outdated, or incomplete personal information.</li>
          <li>
            Request deletion of your personal information where it is no longer necessary for the
            purpose it was collected, subject to any lawful retention requirements.
          </li>
          <li>Object to or request restriction of certain processing activities where applicable.</li>
          <li>
            Lodge a complaint with the Office of the Data Protection Commissioner (ODPC) in Kenya if
            you believe your data protection rights have been infringed.
          </li>
        </ul>
      </PolicyBlock>

      <PolicyBlock title="9. How to Request Access, Correction, or Deletion & Contact Us">
        <p>
          To exercise any of your privacy rights, request deletion or correction of a booking
          record, or ask questions about this Privacy Policy, please contact {config.businessName}{' '}
          with your full name, phone number, and booking reference code (if applicable):
        </p>
        <VerifiedContactCard config={config} onWhatsAppClick={onWhatsAppClick} />
        <p className="text-xs text-[#525753] pt-1">
          Please also review our{' '}
          <a
            href="/terms-of-use"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('/terms-of-use');
            }}
            className="text-[#1B4332] font-medium underline underline-offset-4 hover:text-[#4F6F58]"
          >
            Terms of Use
          </a>
          .
        </p>
      </PolicyBlock>
    </LegalDocumentShell>
  );
}

export function TermsOfUsePage({
  config,
  onBackHome,
  onNavigate,
  onWhatsAppClick,
}: LegalPageProps) {
  return (
    <LegalDocumentShell
      eyebrow="Service Terms"
      title="Terms of Use"
      subtitle={`Terms governing the use of the ${config.businessName} website and residential cleaning booking requests in ${config.city}.`}
      lastUpdated="November 2026"
      onBackHome={onBackHome}
    >
      <PolicyBlock title="1. Acceptance & Acceptable Use of the Website">
        <p>
          By accessing or submitting a booking request on the <strong>{config.businessName}</strong>{' '}
          website, you agree to these Terms of Use. You agree to use this website only for lawful,
          genuine enquiries and residential cleaning booking requests. You must not submit false
          information, attempt automated spam submissions, probe or bypass security controls, or
          seek unauthorised access to administrative areas or another customer&apos;s data.
        </p>
      </PolicyBlock>

      <PolicyBlock title="2. Residential Cleaning Services">
        <p>
          {config.businessName} provides residential and domestic cleaning services across{' '}
          {config.serviceAreas}. Services listed on the website cover:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong>Property sizes:</strong> Bedsitters, one-bedroom apartments, two-bedroom
            apartments, three-bedroom apartments, and four-bedroom or larger houses.
          </li>
          <li>
            <strong>Cleaning types:</strong> Standard/regular home cleaning, deep cleaning, focused
            kitchen and bathroom cleaning, and move-in / move-out cleaning.
          </li>
          <li>
            <strong>Cleaning products options:</strong> Customers may choose either for{' '}
            {config.businessName} to bring cleaning products and equipment, or to provide their own
            household cleaning products.
          </li>
        </ul>
      </PolicyBlock>

      <PolicyBlock title="3. Booking Requests & Service Confirmation">
        <p>
          Submitting the online booking form records a <strong>booking request</strong> (with an
          initial <em>pending</em> status and a reference code such as{' '}
          <code className="font-mono text-xs">LCC-XXXXXX</code>). Submission of the form alone does
          not create a confirmed appointment.
        </p>
        <p>
          A booking becomes confirmed only after {config.businessName} reviews your request and
          confirms availability, service scope, arrival window, and the final quotation directly with
          you by phone, WhatsApp, or email.
        </p>
      </PolicyBlock>

      <PolicyBlock title="4. Pricing, Quotations & Payment Arrangements">
        <p>
          All pricing is stated in <strong>Kenyan Shillings (KES)</strong>. Where a category on the
          price list displays <em>&ldquo;Request a Quote&rdquo;</em> or a starting estimate, the
          final quotation depends on home size, current condition, type of cleaning selected,
          special instructions, and whether {config.businessName} supplies cleaning products and
          equipment.
        </p>
        <p>
          Any change in scope requested on site (such as additional rooms or deep-clean tasks not
          included in the confirmed quote) will be discussed and agreed with you before extra work
          is carried out. Accepted payment methods and payment timing (such as payment upon
          confirmation or upon completion of the clean) are confirmed directly with you before the
          cleaning visit begins.
        </p>
      </PolicyBlock>

      <PolicyBlock title="5. Rescheduling & Cancellations">
        <p>
          If you need to reschedule or cancel a requested or confirmed cleaning appointment, please
          notify {config.businessName} as early as possible by phone or WhatsApp (
          {config.telephone || 'our listed contact number'}) or email ({config.email}) and quote
          your booking reference code.
        </p>
        <p>
          {config.businessName} reserves the right to reschedule or decline a visit if access cannot
          be gained on arrival, if working conditions are unsafe, or in the event of unforeseen
          emergencies, in which case we will contact you promptly to arrange an alternative time.
        </p>
      </PolicyBlock>

      <PolicyBlock title="6. Customer Responsibilities & Safe Premises Access">
        <p>To enable safe and thorough residential cleaning, customers are responsible for:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            Providing accurate location/estate details and timely, authorised entry (including estate
            gate clearance or caretaker instructions where applicable).
          </li>
          <li>
            Ensuring running water and electricity are available during the scheduled cleaning
            window where required for the agreed tasks.
          </li>
          <li>
            Safely storing cash, jewellery, sensitive documents, fragile heirlooms, and personal
            valuables prior to arrival.
          </li>
          <li>
            Informing us in advance of pets, delicate or specialist surfaces, loose fixtures, or any
            health/safety hazards on the premises.
          </li>
          <li>
            Where the customer opts to provide cleaning products, ensuring suitable, properly
            labelled household products are available and safe for the surfaces to be cleaned.
          </li>
          <li>
            Maintaining a respectful and safe working environment throughout the cleaning visit.
          </li>
        </ul>
      </PolicyBlock>

      <PolicyBlock title="7. Service Quality, Limitations & Reasonable Liability">
        <p>
          {config.businessName} takes care to deliver attentive, respectful cleaning in every home.
          If any area covered in your confirmed scope needs additional attention, please raise it
          with us promptly—ideally during the walk-through before departure or shortly after the
          visit—so we can review and address it reasonably.
        </p>
        <p>
          To the fullest extent permitted by applicable Kenyan law, {config.businessName} is not
          responsible for pre-existing wear, fading, structural damage, unsealed or fragile
          surfaces not disclosed in advance, faults in unstable fixtures/appliances, damage caused
          by customer-supplied cleaning chemicals, or indirect or consequential losses. Nothing in
          these Terms excludes or limits any liability that cannot lawfully be excluded or limited
          under the laws of Kenya.
        </p>
      </PolicyBlock>

      <PolicyBlock title="8. Changes to Services & These Terms">
        <p>
          {config.businessName} may update its cleaning service offerings, pricing list, service
          areas, or these Terms of Use from time to time. Updated terms take effect once published
          on this website.
        </p>
      </PolicyBlock>

      <PolicyBlock title="9. Governing Law, Dispute Resolution & Contact">
        <p>
          These Terms of Use are governed by the laws of the <strong>Republic of Kenya</strong>. If
          any concern or dispute arises regarding a booking or cleaning service, we encourage you to
          contact us directly first so we can work toward a prompt, fair, and amicable resolution:
        </p>
        <VerifiedContactCard config={config} onWhatsAppClick={onWhatsAppClick} />
        <p className="text-xs text-[#525753] pt-1">
          For information on how we handle personal data submitted via this website, please read our{' '}
          <a
            href="/privacy-policy"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('/privacy-policy');
            }}
            className="text-[#1B4332] font-medium underline underline-offset-4 hover:text-[#4F6F58]"
          >
            Privacy Policy
          </a>
          .
        </p>
      </PolicyBlock>
    </LegalDocumentShell>
  );
}
