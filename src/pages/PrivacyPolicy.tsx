import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export default function PrivacyPolicy() {
  const effectiveDate = '27 August 2026';

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#050505]/90 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-5 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#D4AF37] to-[#F9E29B] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-black" />
            </div>
            <span className="text-xl font-extrabold tracking-tight">
              GoldX<span className="text-[#D4AF37]">Arena</span>
            </span>
          </Link>

          <Link to="/" className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 lg:px-8 py-14 lg:py-20">
        <div className="max-w-3xl">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#CBAA3D] font-bold">Legal</p>
          <h1 className="mt-3 text-4xl lg:text-5xl font-extrabold tracking-tight">Privacy Policy</h1>
          <p className="mt-4 text-sm text-zinc-500">Effective date: {effectiveDate}</p>
        </div>

        <div className="mt-10 space-y-8 text-sm leading-7 text-zinc-400">
          <section><h2 className="text-xl font-bold text-white">1. About this policy</h2><p className="mt-3">This Privacy Policy explains how GoldX Arena may collect, use, store and protect information when you use our website, client area and trading-related services.</p></section>
          <section><h2 className="text-xl font-bold text-white">2. Information we collect</h2><p className="mt-3">Depending on how you use the platform, we may collect account details such as your name, email address, contact details, account identifiers, verification information, transaction details, support messages and technical information such as IP address, browser type, device information and activity logs.</p></section>
          <section><h2 className="text-xl font-bold text-white">3. How we use information</h2><p className="mt-3">We may use information to create and manage accounts, provide the platform and its features, process deposits and withdrawals, complete verification checks, maintain security, prevent abuse or fraud, provide customer support, troubleshoot technical issues and meet applicable legal or regulatory obligations.</p></section>
          <section><h2 className="text-xl font-bold text-white">4. Transaction and verification data</h2><p className="mt-3">Where required for account or transaction processing, you may be asked to submit identity or payment-related information. Such information should be accurate and belong to you. We may retain transaction and verification records for as long as reasonably necessary for the purposes described in this policy or as required by applicable law.</p></section>
          <section><h2 className="text-xl font-bold text-white">5. Cookies and similar technologies</h2><p className="mt-3">We may use cookies, local storage and similar technologies to keep you signed in, remember preferences, maintain security and understand basic usage patterns. You may be able to control cookies through your browser settings, although disabling some technologies may affect functionality.</p></section>
          <section><h2 className="text-xl font-bold text-white">6. Information sharing</h2><p className="mt-3">We do not treat your personal information as a public profile. We may share information with service providers and technology partners when necessary to operate the platform, with payment or verification providers where applicable, or where disclosure is required to comply with law, legal process, security requirements or to protect rights and property.</p></section>
          <section><h2 className="text-xl font-bold text-white">7. Data security</h2><p className="mt-3">We use reasonable technical and organizational measures designed to protect information against unauthorized access, loss, misuse or alteration. No internet-based system can be guaranteed to be completely secure, so you should also protect your password, devices and account credentials.</p></section>
          <section><h2 className="text-xl font-bold text-white">8. Data retention</h2><p className="mt-3">We retain information for as long as needed to provide services, maintain business and security records, resolve disputes and meet applicable obligations. Retention periods may vary depending on the type of information and the purpose for which it was collected.</p></section>
          <section><h2 className="text-xl font-bold text-white">9. Your choices and rights</h2><p className="mt-3">Depending on your location and applicable law, you may have rights to request access, correction, deletion, restriction or other lawful handling of your personal information. Requests can be submitted through GoldX Arena support using the contact details made available on the site.</p></section>
          <section><h2 className="text-xl font-bold text-white">10. Children</h2><p className="mt-3">The platform is not intended for individuals who are not legally permitted to use financial or trading-related services in their jurisdiction.</p></section>
          <section><h2 className="text-xl font-bold text-white">11. Third-party services</h2><p className="mt-3">The platform may contain links, integrations or services operated by third parties. Their own privacy policies may apply to information they process. We are not responsible for the privacy practices of independent third parties.</p></section>
          <section><h2 className="text-xl font-bold text-white">12. Changes to this policy</h2><p className="mt-3">We may update this policy from time to time to reflect changes to the platform, applicable requirements or our practices. The latest version will be published on this page with a revised effective date.</p></section>
          <section className="rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 p-5"><h2 className="text-base font-bold text-[#E7CB70]">Contact</h2><p className="mt-2">For privacy-related questions or requests, contact GoldX Arena through the support/contact channel provided on this website.</p></section>
        </div>
      </main>

      <footer className="border-t border-zinc-900"><div className="max-w-5xl mx-auto px-5 lg:px-8 py-8 text-center text-[11px] text-zinc-600">© {new Date().getFullYear()} GoldX Arena. All rights reserved.</div></footer>
    </div>
  );
}
