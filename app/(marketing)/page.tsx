import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Droplets,
  ClipboardList,
  UsersRound,
  ShieldCheck,
  History,
  Tags,
  Package,
  WashingMachine,
  Wind,
  FoldVertical,
  ShoppingBag,
  CheckCircle2,
  ArrowRight,
  ArrowDown,
  Sparkles,
  Clock,
  Search,
  UserCheck,
  BarChart3,
  ChevronRight,
} from 'lucide-react'

const STAGES = [
  { label: 'Received', icon: Package, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-950/50', ring: 'ring-blue-200 dark:ring-blue-800' },
  { label: 'Washing', icon: WashingMachine, color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-100 dark:bg-cyan-950/50', ring: 'ring-cyan-200 dark:ring-cyan-800' },
  { label: 'Drying', icon: Wind, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-950/50', ring: 'ring-amber-200 dark:ring-amber-800' },
  { label: 'Folding', icon: FoldVertical, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-950/50', ring: 'ring-purple-200 dark:ring-purple-800' },
  { label: 'Ready', icon: ShoppingBag, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-950/50', ring: 'ring-green-200 dark:ring-green-800' },
  { label: 'Completed', icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-950/50', ring: 'ring-emerald-200 dark:ring-emerald-800' },
]

const FEATURES = [
  { title: 'Real-time tracking', description: 'Customers follow their laundry with a simple unguessable tracking code. No accounts needed.', icon: Search, accent: 'from-blue-500/10 to-transparent' },
  { title: 'Defined workflow', description: 'Every order moves through a clear six-stage pipeline. No ambiguity, no lost loads.', icon: ClipboardList, accent: 'from-cyan-500/10 to-transparent' },
  { title: 'Customer portal', description: 'Customers see their own orders, history, and profile — nothing else. Private by design.', icon: UserCheck, accent: 'from-purple-500/10 to-transparent' },
  { title: 'Audit trail', description: 'Every status change records who, when, and why. Append-only history for full accountability.', icon: ShieldCheck, accent: 'from-emerald-500/10 to-transparent' },
  { title: 'Service catalog', description: 'Admin-managed services with per-kilo and per-piece pricing. Flexible for any laundry business.', icon: Tags, accent: 'from-amber-500/10 to-transparent' },
  { title: 'Operational clarity', description: 'Dashboards, reports, and filters give you a live view of your entire operation.', icon: BarChart3, accent: 'from-rose-500/10 to-transparent' },
]

const STEPS = [
  { n: '01', title: 'Staff receives', text: 'Log the order with services, quantity, and a unique tracking code. The clock starts.' },
  { n: '02', title: 'System tracks', text: 'Every transition is timestamped and attributed. Customers and staff always know where things stand.' },
  { n: '03', title: 'Customer picks up', text: 'Complete the order and record payment in one step. The flow is done.' },
]

export default function MarketingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center transition-transform group-hover:scale-105">
              <Droplets className="w-5 h-5 text-primary-foreground" aria-hidden="true" />
            </div>
            <span className="font-bold text-xl tracking-tight">LabadaFlow</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" size="sm" render={<Link href="/track" />} className="hidden sm:inline-flex">
              Track your laundry
            </Button>
            <Button size="sm" render={<Link href="/login" />}>
              Sign In
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] via-transparent to-transparent" aria-hidden="true" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/[0.02] rounded-full blur-3xl" aria-hidden="true" />

        <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-16 sm:pt-28 sm:pb-24">
          <div className="text-center max-w-3xl mx-auto">
            <Badge variant="secondary" className="mb-6 text-sm px-4 py-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Laundry management, simplified
            </Badge>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
              Every load has a{' '}
              <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                flow.
              </span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              LabadaFlow tracks every order from intake to release — a clear, auditable
              workflow for staff and a transparent experience for customers.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" render={<Link href="/login" />} className="text-base px-8 h-12 shadow-lg shadow-primary/10">
                Start managing orders
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button size="lg" variant="outline" render={<Link href="#flow" />} className="text-base px-8 h-12">
                See how it works
                <ArrowDown className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* Product Preview Dashboard */}
          <div className="mt-16 sm:mt-20 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" aria-hidden="true" />
            <Card className="border-2 shadow-2xl shadow-primary/5 overflow-hidden">
              <CardContent className="p-0">
                {/* Fake browser bar */}
                <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400/80" />
                    <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                    <div className="w-3 h-3 rounded-full bg-green-400/80" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="bg-background rounded-md px-4 py-1 text-xs text-muted-foreground border">
                      app.labadaflow.com/dashboard
                    </div>
                  </div>
                </div>
                {/* Fake dashboard content */}
                <div className="p-6 sm:p-8 bg-gradient-to-br from-background to-muted/20">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    {[
                      { label: 'Total Orders', value: '1,284', change: '+12%', color: 'text-blue-600' },
                      { label: 'Active Now', value: '47', change: '6 in progress', color: 'text-amber-600' },
                      { label: "Today's Revenue", value: '₱8,450', change: '+8%', color: 'text-emerald-600' },
                      { label: 'Customers', value: '342', change: '+5 new', color: 'text-purple-600' },
                    ].map((stat) => (
                      <div key={stat.label} className="bg-card rounded-xl border p-4">
                        <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                        <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                        <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                      </div>
                    ))}
                  </div>
                  {/* Fake order rows */}
                  <div className="space-y-2">
                    {[
                      { id: '#LF-2847', customer: 'Maria Santos', status: 'Washing', statusColor: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300', total: '₱350' },
                      { id: '#LF-2846', customer: 'Juan Dela Cruz', status: 'Ready', statusColor: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300', total: '₱500' },
                      { id: '#LF-2845', customer: 'Ana Reyes', status: 'Folding', statusColor: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300', total: '₱275' },
                    ].map((order) => (
                      <div key={order.id} className="flex items-center justify-between bg-card rounded-lg border px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm font-medium">{order.id}</span>
                          <span className="text-sm text-muted-foreground hidden sm:inline">{order.customer}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium">{order.total}</span>
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${order.statusColor}`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Order Flow Story */}
      <section id="flow" className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Workflow</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              One defined flow, six stages
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Every order follows the same path. No confusion, no missed steps.
            </p>
          </div>

          {/* Desktop flow */}
          <div className="hidden md:flex items-start justify-between relative">
            {/* Connection line */}
            <div className="absolute top-8 left-[8%] right-[8%] h-0.5 bg-border" aria-hidden="true" />
            {STAGES.map((stage, i) => (
              <div key={stage.label} className="flex flex-col items-center text-center relative z-10" style={{ width: '16.666%' }}>
                <div className={`w-16 h-16 rounded-2xl ${stage.bg} ring-1 ${stage.ring} flex items-center justify-center transition-transform hover:scale-110`}>
                  <stage.icon className={`w-7 h-7 ${stage.color}`} aria-hidden="true" />
                </div>
                <p className="mt-4 font-semibold text-sm">{stage.label}</p>
                <p className="text-xs text-muted-foreground mt-1">Stage {i + 1}</p>
              </div>
            ))}
          </div>

          {/* Mobile flow */}
          <div className="md:hidden grid grid-cols-2 gap-4">
            {STAGES.map((stage, i) => (
              <div key={stage.label} className="flex items-center gap-3 bg-card rounded-xl border p-4">
                <div className={`w-12 h-12 rounded-xl ${stage.bg} ring-1 ${stage.ring} flex items-center justify-center shrink-0`}>
                  <stage.icon className={`w-6 h-6 ${stage.color}`} aria-hidden="true" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{stage.label}</p>
                  <p className="text-xs text-muted-foreground">Stage {i + 1}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 sm:py-28 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Features</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Built for clarity
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Everything you need to run a laundry business. Nothing you don&apos;t.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <Card key={f.title} className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.accent} flex items-center justify-center mb-4 ring-1 ring-border`}>
                    <f.icon className="w-6 h-6 text-foreground" aria-hidden="true" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Process</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              How it works
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Three steps from intake to pickup. Simple for staff, transparent for customers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {STEPS.map((s, i) => (
              <div key={s.n} className="relative text-center group">
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-px bg-border" aria-hidden="true">
                    <ChevronRight className="absolute -right-2 -top-2 w-4 h-4 text-muted-foreground/40" />
                  </div>
                )}
                <div className="w-16 h-16 rounded-2xl bg-primary text-primary-foreground font-bold text-xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-primary/10 transition-transform group-hover:scale-105">
                  {s.n}
                </div>
                <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats band */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '6', label: 'Workflow stages' },
              { value: '100%', label: 'Audit coverage' },
              { value: '0', label: 'Lost orders' },
              { value: '24/7', label: 'Customer tracking' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-3xl sm:text-4xl font-extrabold">{stat.value}</p>
                <p className="text-sm text-primary-foreground/70 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-28">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Ready to flow?
          </h2>
          <p className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto">
            Start managing your laundry orders with clarity. Sign in to your dashboard
            or track an existing order.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" render={<Link href="/login" />} className="text-base px-8 h-12 shadow-lg shadow-primary/10">
              Sign in to dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button size="lg" variant="outline" render={<Link href="/track" />} className="text-base px-8 h-12">
              <Search className="w-4 h-4 mr-2" />
              Track your laundry
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Droplets className="w-5 h-5 text-primary" aria-hidden="true" />
            <span className="font-semibold">LabadaFlow</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} LabadaFlow — Every load has a flow.
          </p>
        </div>
      </footer>
    </div>
  )
}
