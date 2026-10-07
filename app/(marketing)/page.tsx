import Link from 'next/link'
import {
  Droplets,
  ArrowRight,
  Search,
  ClipboardList,
  UsersRound,
  Tags,
  UserCheck,
  BarChart3,
  ShieldCheck,
  Store,
  Smartphone,
  Globe,
  CheckCircle2,
  CalendarDays,
  Clock,
  BellRing,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/app/status-badge'
import { OrderFlowStepper } from '@/components/app/order-flow-stepper'
import { SiteNav } from '@/components/marketing/site-nav'
import { HeroVisual } from '@/components/marketing/hero-visual'
import { FlowStory } from '@/components/marketing/flow-story'
import { Reveal } from '@/components/marketing/reveal'

const TRACK_STEPS = ['Received', 'Washing', 'Drying', 'Folding', 'Ready'] as const

const FEATURES = [
  {
    icon: ClipboardList,
    title: 'Order workflow',
    body: 'Every order travels one defined path: received, washing, drying, folding, ready, completed. Forward moves are one step at a time, backward moves require a note, and cancellations require a reason.',
    fragment: 'Six stages · one step at a time',
  },
  {
    icon: UsersRound,
    title: 'Customer management',
    body: 'Keep a real customer list with contact details and notes. Open a customer to see their orders and history — no duplicate paper ledgers.',
    fragment: 'Profiles · order history · notes',
  },
  {
    icon: Tags,
    title: 'Service catalog',
    body: 'Admin-managed services priced per kilo or per piece. The same catalog drives every new order total, so pricing stays consistent at the counter.',
    fragment: 'Per kilo · per piece · always consistent',
  },
  {
    icon: Globe,
    title: 'Public tracking',
    body: 'Each order gets a tracking code. Anyone with the code can open the tracking page and see the current stage — no account needed.',
    fragment: 'Tracking code · no account needed',
  },
  {
    icon: UserCheck,
    title: 'Customer portal',
    body: 'Registered customers sign in to see their own orders, order detail, and profile. They see their laundry and nothing else.',
    fragment: 'My orders · order detail · profile',
  },
  {
    icon: BarChart3,
    title: 'Reports',
    body: 'Today, this week, and lifetime views: orders, revenue, revenue by service, and a breakdown of where every order sits in the flow.',
    fragment: 'Orders · revenue · by service',
  },
]

const HISTORY_ROWS = [
  { from: '—', to: 'Received', note: 'Logged at the counter with services and weight.' },
  { from: 'Received', to: 'Washing', note: 'Load entered the wash cycle.' },
  { from: 'Washing', to: 'Drying', note: 'Transferred to dryers.' },
]

export default function MarketingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteNav />

      <main>
        {/* 1. HERO */}
        <section className="relative overflow-hidden" aria-labelledby="hero-heading">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_50%_at_50%_0%,var(--color-muted)_0%,transparent_70%)]"
            aria-hidden="true"
          />
          <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-14 sm:pt-20 lg:grid lg:grid-cols-2 lg:items-center lg:gap-16 lg:pb-28">
            <div className="max-w-xl">
              <Badge variant="secondary" className="mb-5 px-3.5 py-1.5 font-medium">
                <Droplets className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                Laundry management for real shops
              </Badge>
              <h1 id="hero-heading" className="text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
                Every load has a flow.
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
                LabadaFlow helps laundry shops receive orders, move them through a clear
                six-stage workflow, and let customers check progress with a tracking code.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button size="lg" render={<Link href="/login" />} className="h-12 px-7 text-base">
                  Start managing your laundry
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Button>
                <Button size="lg" variant="outline" render={<Link href="/track" />} className="h-12 px-7 text-base">
                  <Search className="mr-2 h-4 w-4" aria-hidden="true" />
                  Track an order
                </Button>
              </div>
              <p className="mt-5 text-sm text-muted-foreground">
                Order workflow · Customer portal · Public tracking
              </p>
            </div>
            <div className="mt-14 lg:mt-0 lg:pb-6">
              <HeroVisual />
            </div>
          </div>
        </section>

        {/* 2. FLOW STORY */}
        <section id="flow" className="scroll-mt-20 py-20 sm:py-28" aria-labelledby="flow-heading">
          <div className="mx-auto max-w-7xl px-6">
            <Reveal className="mb-12 max-w-2xl sm:mb-16">
              <Badge variant="outline" className="mb-4">The flow</Badge>
              <h2 id="flow-heading" className="text-3xl font-bold tracking-tight sm:text-4xl">
                From counter to pickup, one visible path
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Received → washing → drying → folding → ready → completed. Staff always
                know what to do next, and customers always know where their laundry stands.
              </p>
            </Reveal>
            <FlowStory />
          </div>
        </section>

        {/* 3. PRODUCT SHOWCASE */}
        <section id="product" className="scroll-mt-20 border-y bg-muted/30 py-20 sm:py-28" aria-labelledby="product-heading">
          <div className="mx-auto max-w-7xl px-6">
            <Reveal className="mb-12 max-w-2xl sm:mb-16">
              <Badge variant="outline" className="mb-4">The product</Badge>
              <h2 id="product-heading" className="text-3xl font-bold tracking-tight sm:text-4xl">
                A working system, not a mockup
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                These are the real screens and patterns from the app — the dashboard
                staff open in the morning, the stepper every order carries, and the
                tracking page customers actually see.
              </p>
            </Reveal>

            <div className="space-y-6 lg:space-y-8">
              {/* Dashboard overview */}
              <Reveal>
                <article className="grid overflow-hidden rounded-2xl border bg-card lg:grid-cols-2">
                  <div className="p-6 sm:p-10">
                    <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">01 · Dashboard</p>
                    <h3 className="mt-2 text-2xl font-bold tracking-tight">Open the shop, see the shop</h3>
                    <p className="mt-3 leading-relaxed text-muted-foreground">
                      Active orders, orders ready for pickup, today&apos;s revenue, and
                      customers — plus a live pipeline count per stage and the latest
                      orders with their statuses.
                    </p>
                    <ul className="mt-5 space-y-2 text-sm">
                      {['Needs-attention strip for pickups and new arrivals', 'Order pipeline with per-stage counts', 'Recent orders with live status badges'].map(t => (
                        <li key={t} className="flex items-start gap-2">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="border-t bg-background/60 p-6 sm:p-10 lg:border-l lg:border-t-0" aria-label="Example dashboard layout">
                    <div className="grid grid-cols-2 gap-3">
                      {['Active orders', 'Ready for pickup', "Today's revenue", 'Customers'].map(m => (
                        <div key={m} className="rounded-xl border bg-card p-4">
                          <p className="truncate text-xs font-medium text-muted-foreground">{m}</p>
                          <div className="mt-3 h-6 w-16 rounded bg-muted" aria-hidden="true" />
                          <div className="mt-2 h-3 w-24 rounded bg-muted/70" aria-hidden="true" />
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 space-y-2">
                      {['LF-1042', 'LF-1041'].map(id => (
                        <div key={id} className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
                          <span className="font-mono text-sm font-semibold">{id}</span>
                          <span className="h-5 w-20 rounded-full bg-muted" aria-hidden="true" />
                        </div>
                      ))}
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">Dashboard layout — live data in the app.</p>
                  </div>
                </article>
              </Reveal>

              {/* Order workflow */}
              <Reveal>
                <article className="grid overflow-hidden rounded-2xl border bg-card lg:grid-cols-2">
                  <div className="order-1 p-6 sm:p-10 lg:order-2">
                    <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">02 · Order workflow</p>
                    <h3 className="mt-2 text-2xl font-bold tracking-tight">One stepper on every order</h3>
                    <p className="mt-3 leading-relaxed text-muted-foreground">
                      Staff advance orders one stage at a time. Going backward needs a
                      note, cancelling needs a reason — so the record always explains itself.
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      <StatusBadge status="DRYING" />
                      <Badge variant="outline">Forward: one step</Badge>
                      <Badge variant="outline">Backward: needs a note</Badge>
                    </div>
                  </div>
                  <div className="order-2 border-t bg-background/60 p-6 sm:p-10 lg:order-1 lg:border-l-0 lg:border-r lg:border-t-0">
                    <p className="mb-4 font-mono text-xs text-muted-foreground">Example order · LF-1042 · now drying</p>
                    <OrderFlowStepper currentStatus="DRYING" />
                    <p className="mt-4 text-xs text-muted-foreground">The same stepper staff and customers follow.</p>
                  </div>
                </article>
              </Reveal>

              {/* Order detail / history */}
              <Reveal>
                <article className="grid overflow-hidden rounded-2xl border bg-card lg:grid-cols-2">
                  <div className="p-6 sm:p-10">
                    <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">03 · Order detail</p>
                    <h3 className="mt-2 text-2xl font-bold tracking-tight">Every move leaves a record</h3>
                    <p className="mt-3 leading-relaxed text-muted-foreground">
                      Order detail keeps services, totals, and a status history: what
                      changed, when, who did it, and why. No more “who moved this load?”.
                    </p>
                    <p className="mt-5 flex items-start gap-2 text-sm">
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                      <span>History is append-only — past entries stay put as new ones are added.</span>
                    </p>
                  </div>
                  <div className="border-t bg-background/60 p-6 sm:p-10 lg:border-l lg:border-t-0">
                    <p className="mb-4 font-mono text-xs text-muted-foreground">Example status history</p>
                    <ol className="space-y-3">
                      {HISTORY_ROWS.map((h, i) => (
                        <li key={i} className="flex gap-3 rounded-xl border bg-card p-4">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold">
                            {i + 1}
                          </span>
                          <span>
                            <span className="block text-sm font-semibold">
                              {h.from} → {h.to}
                            </span>
                            <span className="mt-0.5 block text-sm text-muted-foreground">{h.note}</span>
                            <span className="mt-1 block text-xs text-muted-foreground">Recorded by staff · timestamped</span>
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </article>
              </Reveal>

              {/* Customer tracking */}
              <Reveal>
                <article className="grid overflow-hidden rounded-2xl border bg-card lg:grid-cols-2">
                  <div className="order-1 p-6 sm:p-10 lg:order-2">
                    <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">04 · Customer tracking</p>
                    <h3 className="mt-2 text-2xl font-bold tracking-tight">Customers check, staff stops answering “is it ready?”</h3>
                    <p className="mt-3 leading-relaxed text-muted-foreground">
                      The public tracking page shows the current stage in plain words,
                      plus received and estimated-ready dates. Ready orders get a clear
                      pickup prompt.
                    </p>
                    <Button variant="outline" className="mt-5" render={<Link href="/track" />}>
                      <Search className="mr-2 h-4 w-4" aria-hidden="true" />
                      Open the tracking page
                    </Button>
                  </div>
                  <div className="order-2 border-t bg-background/60 p-6 sm:p-10 lg:order-1 lg:border-r lg:border-t-0">
                    <div className="mx-auto max-w-sm rounded-2xl border-2 bg-card p-6 text-center shadow-lg shadow-primary/5">
                      <p className="text-sm text-muted-foreground">Order LF-1042</p>
                      <p className="mt-1 text-2xl font-bold tracking-tight">Folding</p>
                      <div className="mt-3 flex justify-center">
                        <StatusBadge status="FOLDING" size="lg" />
                      </div>
                      <ol className="mt-5 space-y-2.5 text-left" aria-label="Example customer progress">
                        {TRACK_STEPS.map((s, i) => (
                          <li key={s} className="flex items-center gap-3">
                            <span
                              className={
                                i < 3
                                  ? 'flex h-7 w-7 items-center justify-center rounded-full border-2 border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                  : i === 3
                                    ? 'flex h-7 w-7 items-center justify-center rounded-full border-2 border-primary bg-primary/10 text-xs font-bold text-primary'
                                    : 'flex h-7 w-7 items-center justify-center rounded-full border-2 border-border text-xs font-semibold text-muted-foreground/50'
                              }
                            >
                              {i < 3 ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> : i + 1}
                            </span>
                            <span className={i === 3 ? 'text-sm font-semibold' : 'text-sm text-muted-foreground'}>{s}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                </article>
              </Reveal>
            </div>
          </div>
        </section>

        {/* 4. FEATURE STORY */}
        <section className="py-20 sm:py-28" aria-labelledby="features-heading">
          <div className="mx-auto max-w-7xl px-6">
            <Reveal className="mb-12 max-w-2xl sm:mb-16">
              <Badge variant="outline" className="mb-4">Capabilities</Badge>
              <h2 id="features-heading" className="text-3xl font-bold tracking-tight sm:text-4xl">
                Six things it does well
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Nothing more, nothing less. Each one maps to a real part of the app.
              </p>
            </Reveal>
            <div className="grid gap-x-12 gap-y-10 md:grid-cols-2">
              {FEATURES.map((f, i) => (
                <Reveal key={f.title} delay={Math.min(i * 40, 160)}>
                  <article className="border-t-2 border-foreground/80 pt-6">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <f.icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <h3 className="text-lg font-bold tracking-tight">
                        <span className="mr-2 font-mono text-sm font-medium text-muted-foreground">0{i + 1}</span>
                        {f.title}
                      </h3>
                    </div>
                    <p className="mt-3 leading-relaxed text-muted-foreground">{f.body}</p>
                    <p className="mt-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">{f.fragment}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* 5. CUSTOMER EXPERIENCE */}
        <section className="border-y bg-muted/30 py-20 sm:py-28" aria-labelledby="experience-heading">
          <div className="mx-auto max-w-7xl px-6">
            <Reveal className="mb-12 max-w-2xl sm:mb-16">
              <Badge variant="outline" className="mb-4">Two sides, one flow</Badge>
              <h2 id="experience-heading" className="text-3xl font-bold tracking-tight sm:text-4xl">
                Staff manage it. Customers see it.
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                LabadaFlow connects the operational side with the customer experience —
                the same order, viewed two ways.
              </p>
            </Reveal>
            <div className="grid gap-5 md:grid-cols-3">
              <Reveal>
                <Card className="h-full">
                  <CardContent className="p-6 sm:p-7">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                      <Store className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <h3 className="mt-4 text-lg font-bold">Shop staff</h3>
                    <p className="mt-1 font-mono text-xs uppercase tracking-wider text-muted-foreground">manages the laundry</p>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      Receives orders, moves them through the six stages, looks up
                      customers, and closes the pickup — all from the backoffice.
                    </p>
                  </CardContent>
                </Card>
              </Reveal>
              <Reveal delay={80}>
                <Card className="h-full">
                  <CardContent className="p-6 sm:p-7">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                      <Smartphone className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <h3 className="mt-4 text-lg font-bold">Customer</h3>
                    <p className="mt-1 font-mono text-xs uppercase tracking-wider text-muted-foreground">checks the laundry</p>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      Signs in to the portal to see personal orders, order detail with
                      progress, and profile — private to their account.
                    </p>
                  </CardContent>
                </Card>
              </Reveal>
              <Reveal delay={160}>
                <Card className="h-full border-primary/25">
                  <CardContent className="p-6 sm:p-7">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/15">
                      <Globe className="h-6 w-6 text-green-600 dark:text-green-400" aria-hidden="true" />
                    </span>
                    <h3 className="mt-4 text-lg font-bold">Public tracking</h3>
                    <p className="mt-1 font-mono text-xs uppercase tracking-wider text-muted-foreground">sees the current status</p>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      No account? No problem. Enter the tracking code from the slip and
                      see exactly where the load is right now.
                    </p>
                    <Button variant="outline" size="sm" className="mt-4" render={<Link href="/track" />}>
                      <Search className="mr-2 h-4 w-4" aria-hidden="true" />
                      Try the tracking page
                    </Button>
                  </CardContent>
                </Card>
              </Reveal>
            </div>
          </div>
        </section>

        {/* 6. HOW IT WORKS */}
        <section id="how-it-works" className="scroll-mt-20 py-20 sm:py-28" aria-labelledby="how-heading">
          <div className="mx-auto max-w-7xl px-6">
            <Reveal className="mb-12 max-w-2xl sm:mb-16">
              <Badge variant="outline" className="mb-4">How it works</Badge>
              <h2 id="how-heading" className="text-3xl font-bold tracking-tight sm:text-4xl">
                Four steps, one flow
              </h2>
            </Reveal>
            <ol className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
              {[
                { n: '01', icon: ClipboardList, title: 'Receive the order', text: 'Log services, weight, and due date. The customer gets a tracking code.' },
                { n: '02', icon: Droplets, title: 'Move it through the flow', text: 'Advance received → washing → drying → folding → ready, with history.' },
                { n: '03', icon: BellRing, title: 'Customer checks progress', text: 'Portal or tracking code — they see the current stage and pickup signal.' },
                { n: '04', icon: CalendarDays, title: 'Complete the pickup', text: 'Hand over the load, close the order. The record stays for reports.' },
              ].map((s, i) => (
                <li key={s.n} className="relative">
                  <Reveal delay={Math.min(i * 60, 180)}>
                    <p className="font-mono text-5xl font-extrabold tracking-tight text-foreground/10 dark:text-foreground/15" aria-hidden="true">
                      {s.n}
                    </p>
                    <s.icon className="mt-2 h-6 w-6 text-primary" aria-hidden="true" />
                    <h3 className="mt-2 text-lg font-bold">{s.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
                  </Reveal>
                </li>
              ))}
            </ol>
            <Reveal className="mt-10 flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Dates shown on tracking come from the received and due dates staff set at intake.</span>
            </Reveal>
          </div>
        </section>

        {/* 7. FINAL CTA */}
        <section className="px-6 pb-20 sm:pb-28" aria-labelledby="cta-heading">
          <div className="mx-auto max-w-7xl">
            <Reveal>
              <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-16 text-center text-primary-foreground sm:px-12 sm:py-20">
                <div
                  className="pointer-events-none absolute inset-0 opacity-[0.12]"
                  style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
                    backgroundSize: '28px 28px',
                  }}
                  aria-hidden="true"
                />
                <div className="relative mx-auto max-w-2xl">
                  <h2 id="cta-heading" className="text-3xl font-extrabold tracking-tight sm:text-5xl">
                    Keep every load moving.
                  </h2>
                  <p className="mx-auto mt-4 max-w-xl text-lg opacity-80">
                    Manage the flow. Know what&apos;s ready. Keep customers informed.
                  </p>
                  <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <Button size="lg" variant="secondary" render={<Link href="/login" />} className="h-12 px-7 text-base">
                      Start managing your laundry
                      <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      render={<Link href="/track" />}
                      className="h-12 border-primary-foreground/30 bg-transparent px-7 text-base text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                    >
                      <Search className="mr-2 h-4 w-4" aria-hidden="true" />
                      Track an order
                    </Button>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="border-t py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-primary" aria-hidden="true" />
            <span className="font-semibold">LabadaFlow</span>
          </div>
          <nav className="flex items-center gap-4 text-sm text-muted-foreground" aria-label="Footer">
            <Link href="#product" className="hover:text-foreground">Product</Link>
            <Link href="#how-it-works" className="hover:text-foreground">How it works</Link>
            <Link href="/track" className="hover:text-foreground">Track order</Link>
            <Link href="/login" className="hover:text-foreground">Sign in</Link>
          </nav>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} LabadaFlow — Every load has a flow.
          </p>
        </div>
      </footer>
    </div>
  )
}
