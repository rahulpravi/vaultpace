'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Shield,
  Zap,
  Lock,
  ArrowRight,
  CheckCircle2,
  Monitor,
  Smartphone,
  PieChart,
  Wallet,
  ChevronDown,
  Sparkles,
  RefreshCw,
  Download,
} from 'lucide-react';

export default function LaunchLandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const faqs = [
    {
      q: 'Does VaultPace connect to my bank account?',
      a: 'No. VaultPace is intentionally built without Plaid, MX, or direct bank screen-scraping. You maintain total privacy by entering transactions directly or importing standard CSV statements from your financial institution.',
    },
    {
      q: 'Does VaultPace work when I am offline?',
      a: 'Yes. VaultPace operates client-side. All accounts, categories, budgets, and transactions are stored locally on your device. You can log expenses on an airplane or subway without an internet connection.',
    },
    {
      q: 'Can I export my data at any time?',
      a: 'Yes. You own your data. Go to Settings > Data Management and click Export Complete Ledger. You will instantly download a clean, RFC-4180 compliant CSV file and an uncompressed JSON snapshot.',
    },
    {
      q: 'What makes the "Today" budget marker special?',
      a: 'Standard budgeting apps only show a progress bar indicating how much money you have spent. VaultPace adds a vertical indicator line representing exactly where you should be today based on the number of days elapsed in the budget period. If your bar is behind the line, you are under pace; if it surpasses the line, you know to curb spending immediately.',
    },
    {
      q: 'Are there any ads or data tracking?',
      a: 'None. No Google Analytics, no Meta Pixel, no tracking cookies, and no ad banners. 100% telemetry-free.',
    },
  ];

  return (
    <div className="min-h-screen bg-bg text-text selection:bg-accent/30 selection:text-accent font-sans">
      {/* =========================================================================
          Top Navigation Bar
          ========================================================================= */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-bg/85 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/20 border border-accent/40 flex items-center justify-center text-accent">
              <Shield className="w-5 h-5" />
            </div>
            <span className="font-display font-extrabold text-2xl tracking-tight text-text">
              Vault<span className="text-accent">Pace</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-text-muted">
            <a href="#problem" className="hover:text-text transition-colors">Why VaultPace</a>
            <a href="#how-it-works" className="hover:text-text transition-colors">How It Works</a>
            <a href="#features" className="hover:text-text transition-colors">Features</a>
            <a href="#pricing" className="hover:text-text transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-text transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href="/home"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-bg-deep font-bold text-sm shadow-md hover:opacity-90 active:scale-95 transition-all"
            >
              <span>Launch App</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* =========================================================================
          1. Hero Section
          ========================================================================= */}
      <section className="relative pt-24 pb-20 px-6 overflow-hidden">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/15 border border-accent/30 text-accent text-xs font-bold uppercase tracking-wider mb-8">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Cross-Device • Local-First • Zero Surveillance</span>
          </div>

          <h1 className="font-display font-extrabold text-5xl md:text-7xl tracking-tight text-text max-w-4xl mx-auto leading-tight md:leading-none mb-6">
            Master your burn rate. <br className="hidden sm:inline" />
            <span className="text-accent">Keep your privacy.</span>
          </h1>

          <p className="text-lg md:text-xl text-text-muted max-w-2xl mx-auto mb-10 leading-relaxed">
            The fast, ad-free personal budget tracker built for desktop and mobile. Visualize your daily spending pace with the &ldquo;Today&rdquo; marker, log expenses in 3 clicks, and keep 100% of your financial data on your own hardware.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="/home"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-accent text-bg-deep font-display font-bold text-base shadow-xl hover:shadow-accent/25 hover:opacity-95 active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <span>Launch VaultPace Free</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#how-it-works"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-surface border border-border text-text font-semibold text-base hover:bg-surface-subtle transition-all"
            >
              See How It Works
            </a>
          </div>

          {/* Interactive Mockup Container */}
          <div className="relative mx-auto max-w-4xl rounded-3xl p-3 bg-surface border border-border shadow-2xl">
            <div className="rounded-2xl overflow-hidden border border-border/80 bg-bg p-6 text-left">
              <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
                <div>
                  <div className="text-xs uppercase font-bold text-text-muted tracking-wider">Estimated Net Worth</div>
                  <div className="font-display text-3xl font-extrabold text-text mt-0.5">$18,450.00</div>
                </div>
                <div className="flex gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400">
                    +$1,240 this month
                  </span>
                </div>
              </div>

              {/* Budget Pacing Bar Demo */}
              <div className="p-5 rounded-2xl bg-surface border border-border mb-4">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <span className="font-bold text-text">August General Budget</span>
                    <span className="text-xs text-text-muted ml-2">12 days left</span>
                  </div>
                  <span className="text-sm font-bold text-text">$850.00 / $1,500.00</span>
                </div>
                
                {/* Progress bar with Today pace line */}
                <div className="relative w-full h-4 bg-bg rounded-full overflow-visible my-3 border border-border">
                  <div
                    className="h-full bg-accent rounded-full transition-all"
                    style={{ width: '56.6%' }}
                  />
                  {/* Today marker */}
                  <div
                    className="absolute top-[-6px] bottom-[-6px] w-1 bg-white shadow-md z-10"
                    style={{ left: '61.2%' }}
                    title="Expected Pace Today (Day 19 of 31)"
                  >
                    <div className="absolute -top-6 -translate-x-1/2 bg-text text-bg text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
                      Today (61%)
                    </div>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-text-muted">
                  <span className="text-emerald-400 font-semibold">Under expected burn rate by $68.00</span>
                  <span>Daily allowance: $54.16</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          2. The Problem
          ========================================================================= */}
      <section id="problem" className="py-20 px-6 bg-surface border-y border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-display font-extrabold text-3xl md:text-4xl text-text mb-4">
              Why mobile-only budgeting apps feel broken
            </h2>
            <p className="text-text-muted">
              Most budgeting tools are built for casual tapping on a train, not for people who take their personal finances seriously.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 rounded-3xl bg-bg border border-border">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-400 flex items-center justify-center mb-6">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-xl text-text mb-3">
                The 6-Inch Screen Trap
              </h3>
              <p className="text-text-muted leading-relaxed">
                Auditing hundreds of transactions across four accounts on a cramped phone screen is excruciating. When month-end arrives, you want a real monitor, keyboard navigation, and full-width ledger views.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-bg border border-border">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-400 flex items-center justify-center mb-6">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-xl text-text mb-3">
                Fragile Cloud Sync & Silent Overwrites
              </h3>
              <p className="text-text-muted leading-relaxed">
                Connecting bank credentials via third-party aggregators exposes your login tokens, while remote sync servers frequently suffer merge collisions that erase offline ledger edits without warning.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. How It Works
          ========================================================================= */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-display font-extrabold text-3xl md:text-4xl text-text mb-4">
              Financial clarity in three simple steps
            </h2>
            <p className="text-text-muted">
              No twenty-minute onboarding wizards or mandatory bank logins.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-surface border border-border flex flex-col justify-between">
              <div>
                <div className="font-display font-black text-4xl text-accent/40 mb-4">01</div>
                <h3 className="font-display font-bold text-lg text-text mb-2">Set Your Pace Ceilings</h3>
                <p className="text-sm text-text-muted leading-relaxed">
                  Allocate monthly allowances across food, rent, or travel. VaultPace plots a temporal pace marker across the billing cycle.
                </p>
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-surface border border-border flex flex-col justify-between">
              <div>
                <div className="font-display font-black text-4xl text-accent/40 mb-4">02</div>
                <h3 className="font-display font-bold text-lg text-text mb-2">3-Click Quick Logging</h3>
                <p className="text-sm text-text-muted leading-relaxed">
                  Use the embedded increment chips (+1, +5, +10, +50) to log cash or card expenses in under 4 seconds without typing decimal points.
                </p>
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-surface border border-border flex flex-col justify-between">
              <div>
                <div className="font-display font-black text-4xl text-accent/40 mb-4">03</div>
                <h3 className="font-display font-bold text-lg text-text mb-2">Audit & Adjust on Desktop</h3>
                <p className="text-sm text-text-muted leading-relaxed">
                  Sit at your PC to review spending velocity curves, interactive category donuts, and export verified CSV reports anytime.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. Features
          ========================================================================= */}
      <section id="features" className="py-20 px-6 bg-surface border-y border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-display font-extrabold text-3xl md:text-4xl text-text mb-4">
              Engineered around real user complaints
            </h2>
            <p className="text-text-muted">
              Built from public user feedback to eliminate the everyday irritations of mainstream budgeting apps.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-bg border border-border">
              <Monitor className="w-6 h-6 text-accent mb-4" />
              <h4 className="font-bold text-text mb-2">Full Desktop Web Experience</h4>
              <p className="text-xs text-text-muted leading-relaxed">
                Native sidebar navigation, live digital clock, and expansive desktop charts designed for full-size screens.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-bg border border-border">
              <Zap className="w-6 h-6 text-accent mb-4" />
              <h4 className="font-bold text-text mb-2">3-Click Quick Amount Chips</h4>
              <p className="text-xs text-text-muted leading-relaxed">
                Smart amount increments eliminate tedious numeric keypad tapping for common daily expenses.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-bg border border-border">
              <RefreshCw className="w-6 h-6 text-accent mb-4" />
              <h4 className="font-bold text-text mb-2">Frictionless Transfers</h4>
              <p className="text-xs text-text-muted leading-relaxed">
                Dedicated transfer workflow with atomic source/destination validation prevents accounting mistakes.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-bg border border-border">
              <Download className="w-6 h-6 text-accent mb-4" />
              <h4 className="font-bold text-text mb-2">Verified Offline Portability</h4>
              <p className="text-xs text-text-muted leading-relaxed">
                Export standard RFC-4180 CSV and JSON files directly from your browser. Zero cloud lock-in.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-bg border border-border">
              <Wallet className="w-6 h-6 text-accent mb-4" />
              <h4 className="font-bold text-text mb-2">Isolated Currency Pools</h4>
              <p className="text-xs text-text-muted leading-relaxed">
                Multi-currency accounts stay isolated in calculations, eliminating search corruption and messy conversions.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-bg border border-border">
              <PieChart className="w-6 h-6 text-accent mb-4" />
              <h4 className="font-bold text-text mb-2">Mid-Arc SVG Donut Icons</h4>
              <p className="text-xs text-text-muted leading-relaxed">
                Vector category badges rendered directly inside circular wedges for instant visual expense recognition.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. Pricing
          ========================================================================= */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-display font-extrabold text-3xl md:text-4xl text-text mb-4">
              Honest, transparent pricing
            </h2>
            <p className="text-text-muted">
              No ads. No forced subscriptions to see your own money.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Free Tier */}
            <div className="p-8 rounded-3xl bg-surface border border-border flex flex-col justify-between">
              <div>
                <div className="text-sm font-bold text-text-muted uppercase tracking-wider mb-2">Free Core</div>
                <div className="font-display text-4xl font-black text-text mb-4">$0 <span className="text-sm font-normal text-text-muted">/ forever</span></div>
                <p className="text-xs text-text-muted mb-6">Complete offline budgeting for anyone who values privacy.</p>
                <ul className="space-y-3 text-xs text-text-muted">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent" /> Unlimited transactions & budgets</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent" /> Desktop & mobile responsive web</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent" /> Burn rate & Today pace marker</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent" /> Local-first offline storage</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent" /> 1-click CSV & JSON export</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent" /> Zero ads and zero tracking</li>
                </ul>
              </div>
              <Link
                href="/home"
                className="mt-8 block text-center py-3 rounded-xl bg-surface-subtle border border-border text-text font-bold text-sm hover:bg-border transition-all"
              >
                Start Free
              </Link>
            </div>

            {/* Lifetime Supporter */}
            <div className="p-8 rounded-3xl bg-bg border-2 border-accent shadow-xl shadow-accent/10 relative flex flex-col justify-between">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-accent text-bg-deep text-[11px] font-black uppercase tracking-wider">
                Popular Choice
              </div>
              <div>
                <div className="text-sm font-bold text-accent uppercase tracking-wider mb-2">Lifetime Supporter</div>
                <div className="font-display text-4xl font-black text-text mb-4">$14.99 <span className="text-sm font-normal text-text-muted">/ one-time</span></div>
                <p className="text-xs text-text-muted mb-6">Pay once, own forever. Fund independent development.</p>
                <ul className="space-y-3 text-xs text-text-muted">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent" /> Everything in Free Core</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent" /> Golden Supporter badge in Settings</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent" /> 10 custom aesthetic swatch accents</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent" /> Early builds of native desktop app</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent" /> Priority feature request voting</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent" /> No recurring payments ever</li>
                </ul>
              </div>
              <Link
                href="/settings"
                className="mt-8 block text-center py-3 rounded-xl bg-accent text-bg-deep font-bold text-sm hover:opacity-90 transition-all shadow-md"
              >
                Get Supporter Pass
              </Link>
            </div>

            {/* Cloud Sync */}
            <div className="p-8 rounded-3xl bg-surface border border-border flex flex-col justify-between">
              <div>
                <div className="text-sm font-bold text-text-muted uppercase tracking-wider mb-2">Optional Cloud Sync</div>
                <div className="font-display text-4xl font-black text-text mb-4">$3.99 <span className="text-sm font-normal text-text-muted">/ month</span></div>
                <p className="text-xs text-text-muted mb-6">Automated multi-device encrypted backup relay.</p>
                <ul className="space-y-3 text-xs text-text-muted">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent" /> Everything in Supporter</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent" /> End-to-end encrypted device sync</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent" /> Cross-device live conflict resolution</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent" /> 1-click self-serve cancellation</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent" /> Annual discount: $29.99/yr</li>
                </ul>
              </div>
              <Link
                href="/settings"
                className="mt-8 block text-center py-3 rounded-xl bg-surface-subtle border border-border text-text font-bold text-sm hover:bg-border transition-all"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. FAQ
          ========================================================================= */}
      <section id="faq" className="py-20 px-6 bg-surface border-y border-border">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display font-extrabold text-3xl md:text-4xl text-text mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-text-muted">
              Clear answers to common questions about data privacy and device sync.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-border bg-bg overflow-hidden transition-all"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-5 text-left flex items-center justify-between font-bold text-text hover:text-accent transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-accent' : 'text-text-muted'
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-sm text-text-muted leading-relaxed border-t border-border/50 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          7. Final Call to Action
          ========================================================================= */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display font-extrabold text-4xl md:text-5xl text-text mb-6">
            Reclaim your financial focus without surrendering your privacy.
          </h2>
          <p className="text-text-muted text-lg mb-10">
            Start budgeting with clarity and confidence in less than 60 seconds.
          </p>
          <Link
            href="/home"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-accent text-bg-deep font-display font-bold text-lg shadow-xl hover:opacity-95 active:scale-98 transition-all"
          >
            <span>Launch VaultPace Now</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* =========================================================================
          Footer
          ========================================================================= */}
      <footer className="border-t border-border py-8 px-6 text-center text-xs text-text-muted">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-accent" />
            <span className="font-bold text-text">VaultPace</span>
            <span>&copy; {new Date().getFullYear()} VaultPace. 100% telemetry-free.</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/home" className="hover:text-text transition-colors">Dashboard</Link>
            <Link href="/transactions" className="hover:text-text transition-colors">Ledger</Link>
            <Link href="/settings" className="hover:text-text transition-colors">Privacy & Data</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
