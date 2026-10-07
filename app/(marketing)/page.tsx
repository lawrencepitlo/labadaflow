import Link from 'next/link'
import { ArrowRight, Droplets } from 'lucide-react'
import { SiteNav } from '@/components/marketing/site-nav'
import { HeroVisual } from '@/components/marketing/hero-visual'
import { FlowStory } from '@/components/marketing/flow-story'
import { Reveal } from '@/components/marketing/reveal'
import { ShowcaseDashboard, ShowcaseOrderDetail, ShowcaseOrders } from '@/components/marketing/showcase'
import { TrackingVisual } from '@/components/marketing/tracking-visual'

const FLOW_LINE = ['Received', 'Washing', 'Drying', 'Folding', 'Ready', 'Completed'] as const

const PROBLEMS = [
  { title: 'Orders get lost.', sub: 'Paper slips and memory don’t scale.' },
  { title: 'Statuses become unclear.', sub: 'Nobody knows what stage a load is in.' },
  { title: 'Customers ask for updates.', sub: '“Is it ready?” — all day, every day.' },
  { title: 'Staff need to remember too much.', sub: 'The flow lives in people’s heads.' },
]

const HOW_STEPS = [
  { n: '01', title: 'Receive the order', text: 'Log services, weight, and due date. A tracking code is issued.' },
  { n: '02', title: 'Move it through the flow', text: 'Advance one stage at a time, with history on every move.' },
  { n: '03', title: 'Customer checks progress', text: 'Portal or tracking code — the current stage is always visible.' },
  { n: '04', title: 'Complete the pickup', text: 'Hand over the load and close the order. The record stays.' },
]

const TRACKING_STEPS = [
  { n: '01', title: 'Customer receives a tracking code', text: 'Issued at the counter, printed on the slip.' },
  { n: '02', title: 'Checks status anytime', text: 'No account. Just the code.' },
  { n: '03', title: 'Knows when it is ready', text: 'Ready is unmistakable — time to pick up.' },
]

function SectionEyebrow({ children }: { children: string }) {
  return (
    <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">
      <span className="mr-2 inline-block h-1 w-1 rounded-full bg-emerald-400 align-middle" aria-hidden="true" />
      {children}
    </p>
  )
}

export default function MarketingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#060708] text-zinc-100 antialiased">
      <SiteNav />

      <main>
        {/* ——— HERO ——— */}
        <section className="relative overflow-hidden" aria-labelledby="hero-heading">
          {/* ambient background */}
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div className="landing-grid absolute inset-x-0 top-0 h-[720px] opacity-70 [mask-image:radial-gradient(60%_55%_at_50%_0%,black_20%,transparent_75%)]" />
            <div className="absolute left-1/2 top-[-260px] h-[480px] w-[860px] -translate-x-1/2 rounded-full bg-white/[0.04] blur-[140px]" />
            <div className="absolute left-1/2 top-[-120px] h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-emerald-500/[0.05] blur-[140px]" />
            <div className="absolute left-[8%] top-[140px] h-[280px] w-[400px] rounded-full bg-sky-500/[0.04] blur-[120px]" />
            <div className="absolute right-[6%] top-[200px] h-[260px] w-[380px] rounded-full bg-teal-400/[0.035] blur-[120px]" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>

          <div className="relative mx-auto max-w-[1120px] px-5 pb-16 pt-32 text-center sm:px-8 sm:pt-40">
            <Reveal>
              <p className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.02] py-1.5 pl-3 pr-3.5 text-[12px] text-zinc-400">
                <span className="landing-pulse-dot h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
                Laundry operations, brought into focus
              </p>
            </Reveal>
            <Reveal delay={80}>
              <h1
                id="hero-heading"
                className="mx-auto mt-7 max-w-[820px] text-[48px] font-semibold leading-[0.98] tracking-[-0.045em] text-white sm:text-[76px]"
              >
                Every load
                <br />
                has a flow.
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="mx-auto mt-6 max-w-[560px] text-[15px] leading-relaxed text-zinc-400 sm:text-[17px]">
                LabadaFlow gives laundry teams one clear place to manage every order — from received to
                completed — and lets customers follow along.
              </p>
            </Reveal>
            <Reveal delay={220}>
              <div className="mt-9 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
                <Link
                  href="/login"
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-white px-5 text-[14px] font-medium text-black transition-colors hover:bg-zinc-200"
                >
                  Get started
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/track"
                  className="inline-flex h-10 items-center rounded-md border border-white/10 bg-white/[0.02] px-5 text-[14px] font-medium text-zinc-200 transition-colors hover:bg-white/[0.05] hover:text-white"
                >
                  Track an order
                </Link>
              </div>
            </Reveal>
            <Reveal delay={280}>
              <p className="mt-10 font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-600" aria-label="Workflow stages">
                {FLOW_LINE.join('  →  ')}
              </p>
            </Reveal>
          </div>

          {/* hero product visual */}
          <div className="relative mx-auto max-w-[1020px] px-5 pb-20 sm:px-8 sm:pb-28">
            <Reveal delay={120}>
              <HeroVisual />
            </Reveal>
          </div>
        </section>

        {/* hairline divider */}
        <div className="mx-auto max-w-[1120px] px-5 sm:px-8" aria-hidden="true">
          <div className="h-px bg-white/[0.06]" />
        </div>

        {/* ——— FLOW STORY ——— */}
        <section id="how-it-works" className="scroll-mt-20 py-24 sm:py-32" aria-labelledby="flow-heading">
          <div className="mx-auto max-w-[1120px] px-5 sm:px-8">
            <Reveal className="mb-12 max-w-[640px] sm:mb-16">
              <SectionEyebrow>The flow</SectionEyebrow>
              <h2 id="flow-heading" className="mt-4 text-[32px] font-semibold leading-[1.05] tracking-[-0.03em] text-white sm:text-[48px]">
                From counter to pickup, one visible path.
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-zinc-400 sm:text-[16px]">
                Six stages. Staff always know what to do next, customers always know where their laundry
                stands.
              </p>
            </Reveal>
            <FlowStory />

            <Reveal className="mt-14">
              <ol className="grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
                {HOW_STEPS.map(s => (
                  <li key={s.n} className="border-t border-white/10 pt-5">
                    <p className="font-mono text-[11px] text-zinc-600">{s.n}</p>
                    <p className="mt-2 text-[14px] font-medium text-white">{s.title}</p>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-500">{s.text}</p>
                  </li>
                ))}
              </ol>
            </Reveal>
          </div>
        </section>

        <div className="mx-auto max-w-[1120px] px-5 sm:px-8" aria-hidden="true">
          <div className="h-px bg-white/[0.06]" />
        </div>

        {/* ——— PRODUCT SHOWCASE ——— */}
        <section id="product" className="scroll-mt-20 py-24 sm:py-32" aria-labelledby="product-heading">
          <div className="mx-auto max-w-[1120px] px-5 sm:px-8">
            <Reveal className="mb-14 max-w-[640px] sm:mb-20">
              <SectionEyebrow>The product</SectionEyebrow>
              <h2 id="product-heading" className="mt-4 text-[32px] font-semibold leading-[1.05] tracking-[-0.03em] text-white sm:text-[48px]">
                The shop, rendered clearly.
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-zinc-400 sm:text-[16px]">
                Real screens and patterns from the app — the dashboard staff open in the morning, the
                stepper every order carries, the record every move leaves.
              </p>
            </Reveal>

            <div className="space-y-24 sm:space-y-32">
              <Reveal>
                <ShowcaseDashboard />
              </Reveal>
              <Reveal>
                <ShowcaseOrderDetail />
              </Reveal>
              <Reveal>
                <ShowcaseOrders />
              </Reveal>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-[1120px] px-5 sm:px-8" aria-hidden="true">
          <div className="h-px bg-white/[0.06]" />
        </div>

        {/* ——— PROBLEM → SOLUTION ——— */}
        <section className="py-24 sm:py-32" aria-labelledby="solution-heading">
          <div className="mx-auto grid max-w-[1120px] gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:gap-20">
            <Reveal>
              <SectionEyebrow>The problem</SectionEyebrow>
              <ul className="mt-6 divide-y divide-white/[0.06] border-y border-white/[0.06]">
                {PROBLEMS.map(p => (
                  <li key={p.title} className="py-5">
                    <p className="text-[17px] font-medium tracking-tight text-zinc-200">{p.title}</p>
                    <p className="mt-1 text-[14px] text-zinc-500">{p.sub}</p>
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={120} className="flex flex-col justify-center">
              <SectionEyebrow>The answer</SectionEyebrow>
              <h2 id="solution-heading" className="mt-4 text-[36px] font-semibold leading-[1.02] tracking-[-0.03em] text-white sm:text-[52px]">
                One flow.
                <br />
                One system.
              </h2>
              <p className="mt-5 max-w-[420px] text-[15px] leading-relaxed text-zinc-400">
                Every order travels the same defined path. Every move is recorded. Every customer can see
                where their load stands.
              </p>
              <div className="mt-8">
                <Link
                  href="/login"
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-white px-5 text-[14px] font-medium text-black transition-colors hover:bg-zinc-200"
                >
                  Get started
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

        <div className="mx-auto max-w-[1120px] px-5 sm:px-8" aria-hidden="true">
          <div className="h-px bg-white/[0.06]" />
        </div>

        {/* ——— CUSTOMER EXPERIENCE ——— */}
        <section id="tracking" className="scroll-mt-20 py-24 sm:py-32" aria-labelledby="tracking-heading">
          <div className="mx-auto max-w-[1120px] px-5 sm:px-8">
            <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-20">
              <div>
                <Reveal>
                  <SectionEyebrow>Customer experience</SectionEyebrow>
                  <h2 id="tracking-heading" className="mt-4 text-[32px] font-semibold leading-[1.05] tracking-[-0.03em] text-white sm:text-[44px]">
                    Customers see exactly where it stands.
                  </h2>
                  <p className="mt-4 max-w-[440px] text-[15px] leading-relaxed text-zinc-400">
                    A tracking code, checked anytime. The current stage in plain words — and a clear
                    signal when it is ready for pickup.
                  </p>
                </Reveal>
                <ol className="mt-10 space-y-7">
                  {TRACKING_STEPS.map((s, i) => (
                    <Reveal key={s.n} delay={Math.min(i * 80, 160)}>
                      <li className="flex gap-4">
                        <span className="font-mono text-[12px] text-zinc-600">{s.n}</span>
                        <span>
                          <span className="block text-[15px] font-medium text-white">{s.title}</span>
                          <span className="mt-1 block text-[14px] text-zinc-500">{s.text}</span>
                        </span>
                      </li>
                    </Reveal>
                  ))}
                </ol>
                <Reveal delay={120}>
                  <Link
                    href="/track"
                    className="mt-10 inline-flex h-10 items-center rounded-md border border-white/10 bg-white/[0.02] px-5 text-[14px] font-medium text-zinc-200 transition-colors hover:bg-white/[0.05] hover:text-white"
                  >
                    Open the tracking page
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                  </Link>
                </Reveal>
              </div>
              <Reveal delay={100}>
                <div className="relative">
                  <div
                    className="pointer-events-none absolute -inset-10 rounded-full bg-emerald-500/[0.05] blur-[100px]"
                    aria-hidden="true"
                  />
                  <div className="relative">
                    <TrackingVisual />
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ——— FINAL CTA ——— */}
        <section className="px-5 pb-24 sm:px-8 sm:pb-32" aria-labelledby="cta-heading">
          <div className="mx-auto max-w-[1120px]">
            <Reveal>
              <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0B0D0E] px-6 py-20 text-center sm:px-12 sm:py-28">
                <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                  <div className="landing-grid absolute inset-0 opacity-60 [mask-image:radial-gradient(55%_70%_at_50%_100%,black,transparent)]" />
                  <div className="absolute bottom-[-200px] left-1/2 h-[380px] w-[720px] -translate-x-1/2 rounded-full bg-emerald-500/[0.08] blur-[130px]" />
                  <div className="absolute inset-x-[20%] top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                </div>
                <div className="relative mx-auto max-w-[620px]">
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">LabadaFlow</p>
                  <h2 id="cta-heading" className="mt-4 text-[36px] font-semibold leading-[1.0] tracking-[-0.035em] text-white sm:text-[60px]">
                    Keep every load moving.
                  </h2>
                  <p className="mx-auto mt-5 max-w-[440px] text-[15px] leading-relaxed text-zinc-400">
                    LabadaFlow brings the entire laundry workflow into one clear system.
                  </p>
                  <div className="mt-9 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
                    <Link
                      href="/login"
                      className="inline-flex h-10 items-center gap-2 rounded-md bg-white px-5 text-[14px] font-medium text-black transition-colors hover:bg-zinc-200"
                    >
                      Get started
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                    <Link
                      href="/track"
                      className="inline-flex h-10 items-center rounded-md border border-white/10 px-5 text-[14px] font-medium text-zinc-200 transition-colors hover:bg-white/[0.05] hover:text-white"
                    >
                      Track an order
                    </Link>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      {/* ——— FOOTER ——— */}
      <footer className="border-t border-white/[0.06]">
        <div className="mx-auto flex max-w-[1120px] flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row sm:px-8">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-[6px] bg-white">
              <Droplets className="h-3 w-3 text-black" aria-hidden="true" />
            </span>
            <span className="text-[13px] font-semibold tracking-tight text-white">LabadaFlow</span>
            <span className="ml-2 hidden font-mono text-[11px] text-zinc-600 sm:inline">Every load has a flow.</span>
          </div>
          <nav className="flex items-center gap-5 text-[13px] text-zinc-500" aria-label="Footer">
            <Link href="#product" className="transition-colors hover:text-white">
              Product
            </Link>
            <Link href="#how-it-works" className="transition-colors hover:text-white">
              How it works
            </Link>
            <Link href="/track" className="transition-colors hover:text-white">
              Tracking
            </Link>
            <Link href="/login" className="transition-colors hover:text-white">
              Sign in
            </Link>
          </nav>
          <p className="text-[12px] text-zinc-600">© {new Date().getFullYear()} LabadaFlow</p>
        </div>
      </footer>
    </div>
  )
}
