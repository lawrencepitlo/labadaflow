import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

function WindowShell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xl shadow-slate-200/50 dark:border-border dark:bg-card dark:shadow-none">
      <div className="flex h-10 items-center justify-between border-b border-border/80 bg-slate-50/80 px-4 dark:bg-muted/40" aria-hidden="true">
        <span className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
        </span>
        <span className="font-mono text-[11px] font-semibold text-muted-foreground">{label}</span>
        <span className="w-8" />
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  )
}

function Eyebrow({ index, label }: { index: string; label: string }) {
  return (
    <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
      <span>{index}</span>
      <span className="mx-2 text-muted-foreground/60">—</span>
      {label}
    </p>
  )
}

export function ShowcaseDashboard() {
  const rows = [
    { id: 'LF-1042', name: 'Mara Santos', service: 'Wash & Fold · 6.5 kg', status: 'Drying', dot: 'bg-amber-500', total: '₱420' },
    { id: 'LF-1041', name: 'Jose Reyes', service: 'Wash & Fold · 4.0 kg', status: 'Folding', dot: 'bg-purple-500', total: '₱310' },
    { id: 'LF-1040', name: 'Walk-in', service: 'Dry Clean · 2 pcs', status: 'Ready', dot: 'bg-emerald-500', total: '₱260' },
  ]
  return (
    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
      <div>
        <Eyebrow index="01" label="Dashboard" />
        <h3 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Open the shop, see the whole floor.
        </h3>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
          Active loads, ready pickups, today&apos;s revenue, and live machine counts per stage — all updated in real time.
        </p>
        <ul className="mt-6 space-y-2.5">
          {['Needs-attention strip for pickups and overdue loads', 'Live pipeline with per-station load counts', 'Recent walk-in orders with 1-click status advances'].map(t => (
            <li key={t} className="flex items-start gap-2.5 text-xs text-foreground font-medium">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
              {t}
            </li>
          ))}
        </ul>
      </div>
      <div className="relative">
        <WindowShell label="dashboard · today">
          <div className="grid grid-cols-2 gap-2 overflow-hidden rounded-xl bg-slate-50 p-2 dark:bg-muted/30">
            {[
              { l: 'Active Loads', v: '24' },
              { l: 'Ready for Pickup', v: '6' },
              { l: "Today's Intake", v: '₱8,420' },
              { l: 'Avg Wash Time', v: '2.5 hrs' },
            ].map(s => (
              <div key={s.l} className="rounded-lg bg-card p-3 shadow-2xs border border-border/60">
                <p className="text-[10px] font-semibold uppercase text-muted-foreground">{s.l}</p>
                <p className="font-mono text-lg font-bold text-foreground mt-0.5">{s.v}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Live Stage Queue
            </p>
            <div className="divide-y divide-border/60 rounded-xl border border-border/80 overflow-hidden">
              {rows.map(r => (
                <div key={r.id} className="flex items-center justify-between p-2.5 text-xs hover:bg-slate-50 dark:hover:bg-muted/40">
                  <div>
                    <span className="font-mono font-bold text-foreground">{r.id}</span>
                    <span className="text-muted-foreground ml-2">{r.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-foreground">
                      <span className={cn('h-1.5 w-1.5 rounded-full', r.dot)} />
                      {r.status}
                    </span>
                    <span className="font-mono font-bold text-foreground">{r.total}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </WindowShell>
      </div>
    </div>
  )
}

export function ShowcaseOrderDetail() {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
      <div className="order-2 lg:order-1">
        <WindowShell label="order LF-1042 · details">
          <div className="rounded-xl border border-border/80 bg-slate-50/70 p-4 dark:bg-muted/40">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-foreground">LF-1042</span>
                <p className="text-xs text-muted-foreground">Mara Santos · +63 917 555 0142</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-400">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Drying
              </span>
            </div>

            <div className="mt-4 border-t border-border/60 pt-3">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-foreground">Wash, Dry & Fold · 6.5 kg</span>
                <span className="font-mono font-bold">₱420.00</span>
              </div>
              <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                <span>Payment</span>
                <span className="font-semibold text-emerald-600">Paid (Cash)</span>
              </div>
            </div>
          </div>
        </WindowShell>
      </div>
      <div className="order-1 lg:order-2">
        <Eyebrow index="02" label="Intake & Details" />
        <h3 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Everything on one slip, zero guesswork.
        </h3>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
          Weight, services, due times, assigned washer, notes, and thermal receipt with a scannable QR code.
        </p>
      </div>
    </div>
  )
}

export function ShowcaseOrders() {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
      <div>
        <Eyebrow index="03" label="Operations" />
        <h3 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          One-tap stage advancement.
        </h3>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
          Advance from Received → Washing → Drying → Folding → Ready with a single tap. Customers get live status updates instantly on their phones.
        </p>
      </div>
      <div>
        <WindowShell label="kanban · floor board">
          <div className="grid grid-cols-3 gap-2 text-xs">
            {['Washing (4)', 'Drying (6)', 'Ready (7)'].map(title => (
              <div key={title} className="rounded-xl border border-border/80 bg-slate-50/70 p-2.5 dark:bg-muted/30">
                <p className="font-bold text-foreground text-[11px] mb-2">{title}</p>
                <div className="space-y-1.5">
                  <div className="rounded-lg bg-card p-2 shadow-2xs border border-border/60">
                    <p className="font-mono font-bold text-[10px]">LF-1048</p>
                    <p className="text-[10px] text-muted-foreground">Wash & Fold</p>
                  </div>
                  <div className="rounded-lg bg-card p-2 shadow-2xs border border-border/60">
                    <p className="font-mono font-bold text-[10px]">LF-1047</p>
                    <p className="text-[10px] text-muted-foreground">Comforter</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </WindowShell>
      </div>
    </div>
  )
}
