import Link from 'next/link'
import { ArrowRight, Droplets, Sparkles, Search, Store, Waves, Wind, ShoppingBag, ShieldCheck } from 'lucide-react'
import { SiteNav } from '@/components/marketing/site-nav'
import { HeroVisual } from '@/components/marketing/hero-visual'
import { FlowStory } from '@/components/marketing/flow-story'
import { Reveal } from '@/components/marketing/reveal'
import { ShowcaseDashboard, ShowcaseOrderDetail, ShowcaseOrders } from '@/components/marketing/showcase'
import { TrackingVisual } from '@/components/marketing/tracking-visual'

const FLOW_LINE = ['Received & Weighed', 'Washing', 'Drying', 'Folding & Packaging', 'Ready for Pickup'] as const

const FEATURES = [
  {
    icon: Store,
    title: '15-Second Counter Intake',
    desc: 'Log walk-in customers, weigh baskets, add wash or comforter services, and print an instant thermal slip with a QR code in seconds.',
  },
  {
    icon: Waves,
    title: 'Live Machine Pipeline',
    desc: 'Never lose track of which washer or dryer has which load. Advance stages with one tap or drag-and-drop on the floor Kanban board.',
  },
  {
    icon: ShoppingBag,
    title: 'Zero "Is It Ready?" Calls',
    desc: 'Customers scan the code on their paper slip or check online to see their real-time stage, estimated ready time, and pickup notifications.',
  },
]

export default function MarketingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50/70 text-foreground antialiased dark:bg-background">
      <SiteNav />

      <main>
        {/* ——— HERO SECTION ——— */}
        <section className="relative overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-24" aria-labelledby="hero-heading">
          {/* Subtle Ambient Background Gradient */}
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
            <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-linear-to-b from-blue-100/70 to-transparent blur-3xl dark:from-primary/10" />
            <div className="absolute right-10 top-20 h-72 w-72 rounded-full bg-teal-100/50 blur-3xl dark:from-teal-900/10" />
          </div>

          <div className="relative mx-auto max-w-5xl px-5 text-center sm:px-8">
            <Reveal>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                The 21st-Century Laundry Operations Platform
              </div>
            </Reveal>

            <Reveal delay={80}>
              <h1
                id="hero-heading"
                className="mx-auto mt-6 max-w-4xl text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl sm:leading-[1.12]"
              >
                Fast walk-in intake.
                <br />
                <span className="bg-linear-to-r from-blue-600 via-indigo-600 to-teal-600 bg-clip-text text-transparent">
                  Real-time wash stages.
                </span>
                <br />
                Zero &ldquo;Is it ready?&rdquo; calls.
              </h1>
            </Reveal>

            <Reveal delay={160}>
              <p className="mx-auto mt-5 max-w-2xl text-sm sm:text-base leading-relaxed text-muted-foreground">
                LabadaFlow is built specifically for modern laundry shops. Log walk-in orders in 15 seconds, move loads from washer to dryer to folding table, and give customers live stage tracking on their phones.
              </p>
            </Reveal>

            <Reveal delay={220}>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/sign-in"
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-95"
                >
                  Open Backoffice
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/track"
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-border/80 bg-background px-6 text-sm font-semibold text-foreground shadow-2xs transition-colors hover:bg-muted"
                >
                  <Search className="h-4 w-4 text-primary" />
                  Track Order with Slip Code
                </Link>
              </div>
            </Reveal>

            <Reveal delay={280}>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-2 text-xs font-medium text-muted-foreground">
                <span className="font-semibold text-foreground">Standard Shop Flow:</span>
                {FLOW_LINE.map((step, i) => (
                  <span key={step} className="inline-flex items-center gap-2">
                    <span className="rounded-md bg-muted/60 px-2 py-0.5">{step}</span>
                    {i < FLOW_LINE.length - 1 && <span className="text-muted-foreground/40">→</span>}
                  </span>
                ))}
              </div>
            </Reveal>
          </div>

          {/* Hero Workspace Dashboard Visual */}
          <div className="mt-12 sm:mt-16">
            <HeroVisual />
          </div>
        </section>

        {/* ——— THREE PILLARS / FEATURES SECTION ——— */}
        <section id="features" className="border-t border-border/80 bg-white py-16 dark:bg-card sm:py-24">
          <div className="mx-auto max-w-5xl px-5 sm:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
              <p className="font-mono text-xs font-bold uppercase tracking-wider text-primary">
                Built for Counter Operations
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Everything your laundry team needs to run smooth shifts.
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {FEATURES.map(feat => (
                <div
                  key={feat.title}
                  className="rounded-2xl border border-slate-200/90 bg-slate-50/50 p-6 shadow-2xs transition-all hover:shadow-md dark:border-border dark:bg-muted/30"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs mb-4">
                    <feat.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-foreground">{feat.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ——— LIVE INTERACTIVE CUSTOMER TRACKING PREVIEW ——— */}
        <section id="tracking-demo" className="border-t border-border/80 bg-slate-50/70 py-16 dark:bg-background sm:py-24">
          <div className="mx-auto max-w-5xl px-5 sm:px-8">
            <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
              <div>
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-primary">
                  Instant Customer Transparency
                </span>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  Let customers check progress without calling your shop.
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  When walk-in customers leave their laundry at the counter, they get a tracking code on their receipt slip. They can track the live wash, dry, and fold stages from any phone browser without downloading an app.
                </p>

                <div className="mt-6 space-y-3 text-xs">
                  <div className="flex items-start gap-2.5 font-medium text-foreground">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 font-bold">✓</span>
                    <span>Live stage updates: Received, Washing, Drying, Folding, Ready for Pickup</span>
                  </div>
                  <div className="flex items-start gap-2.5 font-medium text-foreground">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 font-bold">✓</span>
                    <span>Transparent weight, item breakdown, and counter payment balance</span>
                  </div>
                  <div className="flex items-start gap-2.5 font-medium text-foreground">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 font-bold">✓</span>
                    <span>Estimated pickup times with automated ready notifications</span>
                  </div>
                </div>

                <div className="mt-8">
                  <Link
                    href="/track"
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition-all"
                  >
                    Try Order Tracking Live
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              <div>
                <TrackingVisual defaultIndex={1} />
              </div>
            </div>
          </div>
        </section>

        {/* ——— WORKFLOW FLOW STORY ——— */}
        <section id="workflow" className="border-t border-border/80 bg-white py-16 dark:bg-card sm:py-24">
          <div className="mx-auto max-w-5xl px-5 sm:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-primary">
                Workflow Machine
              </span>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                From intake counter to pickup shelf.
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                See how every stage communicates with both your backoffice staff and the customer.
              </p>
            </div>

            <FlowStory />
          </div>
        </section>

        {/* ——— BACKOFFICE SHOWCASE ——— */}
        <section id="product" className="border-t border-border/80 bg-slate-50/70 py-16 dark:bg-background sm:py-24">
          <div className="mx-auto max-w-5xl space-y-20 px-5 sm:px-8">
            <ShowcaseDashboard />
            <ShowcaseOrderDetail />
            <ShowcaseOrders />
          </div>
        </section>

        {/* ——— CALL TO ACTION BANNER ——— */}
        <section className="border-t border-border/80 bg-primary/5 py-16 dark:bg-primary/10">
          <div className="mx-auto max-w-4xl px-5 text-center sm:px-8">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Upgrade your laundry shop with modern SaaS operations.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Sign in to manage your laundry operations, track walk-ins, and keep your customers happy.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/sign-in"
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all active:scale-95"
              >
                Sign In to Workspace
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/track"
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-border/80 bg-background px-6 text-sm font-semibold text-foreground shadow-2xs hover:bg-muted transition-colors"
              >
                <Search className="h-4 w-4 text-primary" />
                Track Customer Order
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ——— MODERN FOOTER ——— */}
      <footer className="border-t border-border/80 bg-white py-10 dark:bg-card">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-5 text-xs text-muted-foreground sm:flex-row sm:px-8">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Droplets className="h-3 w-3" />
            </span>
            <span className="font-bold text-foreground">LabadaFlow</span>
            <span>&copy; {new Date().getFullYear()} Modern Laundry Operations</span>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/track" className="hover:text-foreground transition-colors">
              Public Tracking
            </Link>
            <Link href="/sign-in" className="hover:text-foreground transition-colors">
              Sign In
            </Link>
            <Link href="/sign-up" className="hover:text-foreground transition-colors">
              Register Customer Pass
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
