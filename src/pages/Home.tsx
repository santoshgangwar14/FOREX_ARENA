import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Globe2,
  Headphones,
  ShieldCheck,
  TrendingUp,
  WalletCards,
} from 'lucide-react';

const markets = [
  ['XAUUSD', 'Gold / US Dollar', '+0.82%'],
  ['EURUSD', 'Euro / US Dollar', '+0.21%'],
  ['GBPUSD', 'Pound / US Dollar', '-0.14%'],
  ['NAS100', 'Nasdaq 100', '+0.67%'],
  ['US30', 'Dow Jones', '+0.32%'],
];

const benefits = [
  {
    icon: TrendingUp,
    title: 'Real-time market access',
    text: 'Trade major forex pairs, gold, indices and selected digital assets from one professional web terminal.',
  },
  {
    icon: ShieldCheck,
    title: 'Account-first security',
    text: 'Identity verification, controlled account funding and clear transaction history keep your account organized.',
  },
  {
    icon: WalletCards,
    title: 'Simple funding flow',
    text: 'Submit deposits and withdrawals from your client area with transparent status tracking.',
  },
  {
    icon: BarChart3,
    title: 'Professional trading view',
    text: 'Focused charts, live bid/ask pricing, positions and order management in one workspace.',
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050505]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#D4AF37] to-[#F9E29B] flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-black rotate-45" />
            </div>
            <span className="text-xl font-extrabold tracking-tight">
              GoldX<span className="text-[#D4AF37]">Arena</span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-8 text-sm text-zinc-400">
            <a href="#markets" className="hover:text-white">Markets</a>
            <a href="#why-goldx" className="hover:text-white">Why GoldX Arena</a>
            <a href="#platform" className="hover:text-white">Platform</a>
            <a href="#support" className="hover:text-white">Support</a>
          </nav>

          <div className="flex items-center gap-2.5">
            <Link
              to="/login"
              className="px-4 py-2 text-xs font-bold text-zinc-300 hover:text-white"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="px-4 py-2.5 rounded-lg bg-[#D4AF37] hover:bg-[#F9E29B] text-black text-xs font-extrabold"
            >
              Open Account
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(212,175,55,0.12),transparent_34%),radial-gradient(circle_at_80%_30%,rgba(212,175,55,0.06),transparent_30%)]" />

          <div className="relative max-w-7xl mx-auto px-5 lg:px-8 pt-20 lg:pt-28 pb-20 lg:pb-28">
            <div className="grid lg:grid-cols-[1.15fr_.85fr] gap-14 items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/5 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] font-bold text-[#E7CB70]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live market environment
                </div>

                <h1 className="mt-6 text-5xl lg:text-7xl font-extrabold tracking-tight leading-[0.98]">
                  Trade smarter.
                  <span className="block text-[#D4AF37]">Trade GoldX.</span>
                </h1>

                <p className="mt-7 max-w-2xl text-base lg:text-lg text-zinc-400 leading-relaxed">
                  A premium trading environment built for traders who want fast
                  market access, professional execution tools and a clean client experience.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#D4AF37] hover:bg-[#F9E29B] text-black text-sm font-extrabold"
                  >
                    Start Trading
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <Link
                    to="/trade"
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 text-white text-sm font-bold"
                  >
                    Explore Platform
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>

                <div className="mt-9 flex flex-wrap gap-x-7 gap-y-3 text-xs text-zinc-500">
                  <span className="inline-flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Professional web terminal
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Live pricing environment
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Secure account workflow
                  </span>
                </div>
              </div>

              <div className="rounded-3xl border border-zinc-800 bg-[#0b0d10]/95 p-4 shadow-2xl shadow-black/30">
                <div className="rounded-2xl border border-zinc-800 bg-[#07090c] overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">
                        Market Snapshot
                      </p>
                      <p className="text-sm font-bold mt-1">Gold & Global Markets</p>
                    </div>
                    <div className="text-[10px] text-emerald-400 font-bold">
                      LIVE
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    {markets.map(([symbol, label, change]) => (
                      <div
                        key={symbol}
                        className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 flex items-center justify-between"
                      >
                        <div>
                          <p className="text-sm font-mono font-bold">{symbol}</p>
                          <p className="text-[10px] text-zinc-600 mt-0.5">{label}</p>
                        </div>
                        <span
                          className={`text-xs font-mono font-bold ${
                            change.startsWith('-')
                              ? 'text-rose-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {change}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-zinc-800 p-4">
                    <div className="h-36 rounded-xl bg-[linear-gradient(180deg,rgba(212,175,55,0.05),transparent)] relative overflow-hidden">
                      <div className="absolute inset-x-0 top-1/2 h-px bg-zinc-800" />
                      <svg viewBox="0 0 500 150" className="w-full h-full">
                        <polyline
                          fill="none"
                          stroke="#D4AF37"
                          strokeWidth="2"
                          points="0,112 35,108 70,118 105,90 140,96 175,76 210,82 245,62 280,70 315,48 350,54 390,32 425,42 462,25 500,30"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="markets" className="border-y border-zinc-900 bg-[#080808]">
          <div className="max-w-7xl mx-auto px-5 lg:px-8 py-7">
            <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
              <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600 font-bold">
                Markets
              </div>
              {markets.map(([symbol, label, change]) => (
                <div key={symbol} className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold">{symbol}</span>
                  <span className="text-[10px] text-zinc-600">{label}</span>
                  <span className={`text-[10px] font-bold ${
                    change.startsWith('-') ? 'text-rose-400' : 'text-emerald-400'
                  }`}>
                    {change}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="why-goldx" className="max-w-7xl mx-auto px-5 lg:px-8 py-20 lg:py-24">
          <div className="max-w-2xl">
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#CBAA3D] font-bold">
              Why GoldX Arena
            </p>
            <h2 className="mt-3 text-3xl lg:text-4xl font-bold tracking-tight">
              A trading experience built around the trader.
            </h2>
            <p className="mt-4 text-sm text-zinc-500 leading-relaxed">
              From market access to account management, every major workflow is kept in one
              focused environment.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={benefit.title}
                  className="rounded-2xl border border-zinc-900 bg-[#0a0c0f] p-5"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/15 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  <h3 className="mt-5 text-sm font-bold">{benefit.title}</h3>
                  <p className="mt-2 text-xs text-zinc-600 leading-relaxed">
                    {benefit.text}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section id="platform" className="border-y border-zinc-900 bg-[#080808]">
          <div className="max-w-7xl mx-auto px-5 lg:px-8 py-20">
            <div className="grid lg:grid-cols-2 gap-10 items-center">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#CBAA3D] font-bold">
                  One trading workspace
                </p>
                <h2 className="mt-3 text-3xl lg:text-4xl font-bold">
                  From watchlist to order in one flow.
                </h2>
                <p className="mt-4 text-sm text-zinc-500 leading-relaxed max-w-xl">
                  Monitor instruments, review the chart, place orders and manage open
                  positions without leaving the trading environment.
                </p>

                <Link
                  to="/trade"
                  className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[#D4AF37] hover:text-[#F9E29B]"
                >
                  Open the trading terminal
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  ['01', 'Market Watch', 'Keep key instruments in view.'],
                  ['02', 'Chart', 'Focus on the price action.'],
                  ['03', 'Order Entry', 'Manage size and execution.'],
                  ['04', 'Positions', 'Monitor and close trades in one place.'],
                ].map(([number, title, text]) => (
                  <div
                    key={number}
                    className="rounded-2xl border border-zinc-800 bg-[#0a0c0f] p-5"
                  >
                    <span className="text-[10px] font-mono text-[#D4AF37]">{number}</span>
                    <h3 className="mt-4 text-sm font-bold">{title}</h3>
                    <p className="mt-2 text-xs text-zinc-600">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="support" className="max-w-7xl mx-auto px-5 lg:px-8 py-20">
          <div className="rounded-3xl border border-zinc-800 bg-[#0a0c0f] p-8 lg:p-12 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#CBAA3D] font-bold">
                Client support
              </p>
              <h2 className="mt-3 text-3xl font-bold">
                Need help with your account?
              </h2>
              <p className="mt-3 text-sm text-zinc-500 max-w-xl">
                Contact GoldX Arena support or raise a formal complaint from your client area.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-zinc-800 bg-zinc-900 text-sm font-bold"
              >
                <Headphones className="w-4 h-4" />
                Contact Us
              </Link>
              <Link
                to="/complaints"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#D4AF37] hover:bg-[#F9E29B] text-black text-sm font-extrabold"
              >
                Raise a Complaint
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-900 bg-[#050505]">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 py-8 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <p className="text-sm font-extrabold">
              GoldX<span className="text-[#D4AF37]">Arena</span>
            </p>
            <p className="text-[10px] text-zinc-700 mt-1">
              © {new Date().getFullYear()} GoldX Arena. All rights reserved.
            </p>
          </div>

          <div className="flex flex-wrap gap-5 text-[11px] text-zinc-600">
            <Link to="/profile" className="hover:text-zinc-300">Account</Link>
            <Link to="/kyc" className="hover:text-zinc-300">Verification</Link>
            <Link to="/contact" className="hover:text-zinc-300">Contact</Link>
            <Link to="/complaints" className="hover:text-zinc-300">Complaints</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}