import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

export default function TermsAndConditions() {
  const effectiveDate = '27 August 2026';

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#050505]/90 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-5 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#D4AF37] to-[#F9E29B] flex items-center justify-center">
              <FileText className="w-4 h-4 text-black" />
            </div>
            <span className="text-xl font-extrabold tracking-tight">GoldX<span className="text-[#D4AF37]">Arena</span></span>
          </Link>
          <Link to="/" className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 lg:px-8 py-14 lg:py-20">
        <div className="max-w-3xl">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#CBAA3D] font-bold">Legal</p>
          <h1 className="mt-3 text-4xl lg:text-5xl font-extrabold tracking-tight">Terms &amp; Conditions</h1>
          <p className="mt-4 text-sm text-zinc-500">Effective date: {effectiveDate}</p>
        </div>

        <div className="mt-10 space-y-8 text-sm leading-7 text-zinc-400">
          <section><h2 className="text-xl font-bold text-white">1. Acceptance of these terms</h2><p className="mt-3">By accessing or using GoldX Arena, you acknowledge that you have read, understood and agree to these Terms &amp; Conditions. If you do not agree with them, do not use the platform.</p></section>
          <section><h2 className="text-xl font-bold text-white">2. Eligibility</h2><p className="mt-3">You must be legally permitted to use the services in your jurisdiction and must provide information that is accurate, complete and current. We may restrict or refuse access where use is not permitted by applicable law or platform policy.</p></section>
          <section><h2 className="text-xl font-bold text-white">3. Account responsibility</h2><p className="mt-3">You are responsible for keeping your login credentials secure and for activity carried out through your account. You must not share access, impersonate another person, or use the platform for unlawful, deceptive or abusive activity.</p></section>
          <section><h2 className="text-xl font-bold text-white">4. Platform services</h2><p className="mt-3">GoldX Arena provides a web-based environment for account management, market information, charts, order entry and related client functions. Features, instruments, availability and technical specifications may change without notice when reasonably necessary to maintain or improve the platform.</p></section>
          <section><h2 className="text-xl font-bold text-white">5. Market information</h2><p className="mt-3">Market prices, charts, quotes and other displayed information may come from third-party data providers or external market sources. Such data can be delayed, unavailable, inaccurate or different from prices shown by another venue. You should not treat displayed market information as a guarantee of execution price or availability.</p></section>
          <section><h2 className="text-xl font-bold text-white">6. Trading risk</h2><p className="mt-3">Trading and leveraged products can involve substantial risk of loss. Past performance is not a guarantee of future results. You are solely responsible for evaluating whether a product, position size or strategy is appropriate for you. Nothing on this website should be interpreted as personalized investment, legal or tax advice.</p></section>
          <section><h2 className="text-xl font-bold text-white">7. Orders and execution</h2><p className="mt-3">Orders are subject to the platform's available liquidity, pricing, technical systems, account rules and applicable limitations. Displayed bid and ask prices are not a promise that an order will always be accepted or executed at that exact price.</p></section>
          <section><h2 className="text-xl font-bold text-white">8. Deposits and withdrawals</h2><p className="mt-3">Deposits and withdrawals are subject to the instructions, verification requirements, processing times and transaction checks presented by the platform. You are responsible for entering correct payment details and using the supported network or method. Transactions sent using an unsupported network or incorrect address may be irreversible.</p></section>
          <section><h2 className="text-xl font-bold text-white">9. Prohibited activities</h2><p className="mt-3">You may not use the platform for fraud, money laundering, market abuse, unauthorized access, malicious software, identity misuse, payment manipulation or any activity that violates applicable law or the rights of others.</p></section>
          <section><h2 className="text-xl font-bold text-white">10. Suspension and termination</h2><p className="mt-3">We may suspend, restrict or terminate access where we reasonably believe that an account breaches these terms, creates a security risk, involves unlawful activity, fails required verification or otherwise threatens the integrity of the platform.</p></section>
          <section><h2 className="text-xl font-bold text-white">11. Availability and technical issues</h2><p className="mt-3">We aim to keep the platform available, but uninterrupted access cannot be guaranteed. Maintenance, provider outages, connectivity failures, market closures, cyber incidents or other events may affect availability or functionality.</p></section>
          <section><h2 className="text-xl font-bold text-white">12. Intellectual property</h2><p className="mt-3">Unless otherwise stated, the GoldX Arena name, branding, interface, software, content and other platform materials are owned by or licensed to the platform and may not be copied, modified or redistributed without authorization.</p></section>
          <section><h2 className="text-xl font-bold text-white">13. Third-party links and services</h2><p className="mt-3">The platform may link to or use third-party services. Those providers operate under their own terms and policies. We are not responsible for independent third-party services beyond what applicable law requires.</p></section>
          <section><h2 className="text-xl font-bold text-white">14. Limitation of liability</h2><p className="mt-3">To the maximum extent permitted by applicable law, GoldX Arena is not liable for indirect, incidental or consequential losses arising from use of the platform, market movements, third-party outages, connectivity failures or user errors, except where liability cannot lawfully be excluded.</p></section>
          <section><h2 className="text-xl font-bold text-white">15. Changes to these terms</h2><p className="mt-3">We may update these terms from time to time. Continued use of the platform after updated terms are published constitutes acceptance of the revised terms to the extent permitted by applicable law.</p></section>
          <section><h2 className="text-xl font-bold text-white">16. Governing law</h2><p className="mt-3">The applicable governing law and dispute-resolution forum will depend on the entity providing the relevant service and the laws applicable to your relationship with GoldX Arena. Nothing in these terms excludes rights that cannot lawfully be excluded in your jurisdiction.</p></section>
          <section className="rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 p-5"><h2 className="text-base font-bold text-[#E7CB70]">Important</h2><p className="mt-2">This page is a platform terms template and should be reviewed by a qualified lawyer before being treated as the final legal terms for a live financial service, particularly for licensing, jurisdiction, consumer protection, AML/KYC and payment requirements.</p></section>
        </div>
      </main>

      <footer className="border-t border-zinc-900"><div className="max-w-5xl mx-auto px-5 lg:px-8 py-8 text-center text-[11px] text-zinc-600">© {new Date().getFullYear()} GoldX Arena. All rights reserved.</div></footer>
    </div>
  );
}
