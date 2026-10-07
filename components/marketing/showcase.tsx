import { Check } from 'lucide-react'
import { cn } from 'cn'

function WindowShell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#0B0D0E] shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9),0_0_60px_-48px_rgba(255,255,255,0.12)]">
      <div
        className="pointer-events-none absolute inset-x-[12%] top-0 z-10 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
        aria-hidden="true"
      />
      <div className="flex h-10 items-center gap-3 border-b border-white/[0.06] px-4" aria-hidden="true">
        <span className="flex gap-1.5">
          <span className="h-2 w-2 rounded-full bg-white/10" />
          <span className="h-2 w-2 rounded-full bg-white/10" />
          <span className="h-2 w-2 rounded-full bg-white/10" />
        </span>
        <span className="mx-auto font-mono text-[11px] text-zinc-600">{label}</span>
        <span className="w-10" />
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  )
}

function Eyebrow({ index, label }: { index: string; label: string }) {
  return (
    <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-500">
      <span className="text-zinc-600">{index}</span>
      <span className="mx-2 text-zinc-700">—</span>
      {label}
    </p>
  )
}

export function ShowcaseDashboard() {
  const rows = [
    { id: 'LF-1042', name: 'Mara Santos', service: 'Wash & Fold · 6.5 kg', status: 'Drying', dot: 'bg-amber-400', total: '₱420' },
    { id: 'LF-1041', name: 'Jose Reyes', service: 'Wash & Fold · 4.0 kg', status: 'Folding', dot: 'bg-violet-400', total: '₱310' },
    { id: 'LF-1040', name: 'Walk-in', service: 'Dry Clean · 2 pcs', status: 'Ready', dot: 'bg-emerald-400', total: '₱260' },
  ]
  return (
    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
      <div>
        <Eyebrow index="01" label="Dashboard" />
        <h3 className="mt-3 text-[28px] font-semibold tracking-[-0.02em] text-white sm:text-[32px]">
          Open the shop, see the shop.
        </h3>
        <p className="mt-3 max-w-md text-[15px] leading-relaxed text-zinc-400">
          Active orders, pickups waiting, today&apos;s revenue, and a live count per stage — plus the latest
          orders with their statuses.
        </p>
        <ul className="mt-6 space-y-2.5">
          {['Needs-attention strip for pickups and arrivals', 'Pipeline with per-stage counts', 'Recent orders with live statuses'].map(t => (
            <li key={t} className="flex items-start gap-2.5 text-[14px] text-zinc-300">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400/80" aria-hidden="true" />
              {t}
            </li>
          ))}
        </ul>
      </div>
      <div className="relative">
        <div
          className="pointer-events-none absolute -inset-8 rounded-full bg-white/[0.03] blur-[90px]"
          aria-hidden="true"
        />
        <div className="relative">
          <WindowShell label="dashboard · today">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-white/[0.06] bg-white/[0.05]">
          {[
            { l: 'Active', v: '24' },
            { l: 'Ready', v: '6' },
            { l: 'Revenue', v: '₱8,420' },
            { l: 'Customers', v: '312' },
          ].map(m => (
            <div key={m.l} className="bg-[#0B0D0E] px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-600">{m.l}</p>
              <p className="tnum mt-0.5 text-[18px] font-semibold text-white">{m.v}</p>
            </div>
          ))}
        </div>
        <ul className="mt-3 divide-y divide-white/[0.05] rounded-lg border border-white/[0.06]">
          {rows.map(r => (
            <li key={r.id} className="flex items-center gap-3 px-4 py-2.5">
              <span className="font-mono text-[12px] text-zinc-200">{r.id}</span>
              <span className="min-w-0 flex-1 truncate text-[13px] text-zinc-400">
                {r.name} · <span className="text-zinc-500">{r.service}</span>
              </span>
              <span className="hidden items-center gap-1.5 rounded-md border border-white/[0.07] bg-white/[0.03] px-2 py-0.5 text-[11px] text-zinc-200 sm:inline-flex">
                <span className={cn('h-1.5 w-1.5 rounded-full', r.dot)} aria-hidden="true" />
                {r.status}
              </span>
              <span className="tnum text-[13px] text-zinc-200">{r.total}</span>
            </li>
          ))}
        </ul>
          </WindowShell>
        </div>
      </div>
    </div>
  )
}

export function ShowcaseOrderDetail() {
  const history = [
    { move: 'Received → Washing', note: 'Load entered the wash cycle.', meta: 'Staff · 10:02 AM' },
    { move: 'Washing → Drying', note: 'Transferred to dryers.', meta: 'Staff · 11:40 AM' },
    { move: 'Drying → Folding', note: 'Folded and packed.', meta: 'Staff · 1:15 PM' },
  ]
  return (
    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
      <div className="order-1 lg:order-2">
        <Eyebrow index="02" label="Order detail" />
        <h3 className="mt-3 text-[28px] font-semibold tracking-[-0.02em] text-white sm:text-[32px]">
          Every move leaves a record.
        </h3>
        <p className="mt-3 max-w-md text-[15px] leading-relaxed text-zinc-400">
          Services, totals, and an append-only status history: what changed, when, who did it, and why.
          Backward moves need a note — so the record explains itself.
        </p>
        <p className="mt-6 rounded-lg border border-white/[0.07] bg-white/[0.02] px-4 py-3 font-mono text-[12px] leading-relaxed text-zinc-500">
          forward: one step · backward: needs a note
          <br />
          cancel: needs a reason
        </p>
      </div>
      <div className="order-2 lg:order-1">
        <WindowShell label="orders · LF-1042 · history">
          <ol className="space-y-2.5">
            {history.map((h, i) => (
              <li key={h.move} className="flex gap-3 rounded-lg border border-white/[0.06] bg-white/[0.015] p-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 text-[11px] font-medium text-zinc-300">
                  {i + 1}
                </span>
                <span>
                  <span className="block text-[13px] font-medium text-white">{h.move}</span>
                  <span className="mt-0.5 block text-[13px] text-zinc-400">{h.note}</span>
                  <span className="mt-1 block font-mono text-[11px] text-zinc-600">{h.meta}</span>
                </span>
              </li>
            ))}
          </ol>
        </WindowShell>
      </div>
    </div>
  )
}

export function ShowcaseOrders() {
  const steps = ['Received', 'Washing', 'Drying', 'Folding', 'Ready']
  return (
    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
      <div>
        <Eyebrow index="03" label="Orders" />
        <h3 className="mt-3 text-[28px] font-semibold tracking-[-0.02em] text-white sm:text-[32px]">
          One stepper on every order.
        </h3>
        <p className="mt-3 max-w-md text-[15px] leading-relaxed text-zinc-400">
          Staff advance orders one stage at a time. The same stepper follows the order from the counter to the
          customer&apos;s screen.
        </p>
        <ul className="mt-6 space-y-2.5">
          {['Forward moves are always one step', 'The customer follows the same stages', 'Ready is unmistakable'].map(t => (
            <li key={t} className="flex items-start gap-2.5 text-[14px] text-zinc-300">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400/80" aria-hidden="true" />
              {t}
            </li>
          ))}
        </ul>
      </div>
      <WindowShell label="orders · LF-1042 · now drying">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-medium text-white">Wash & Fold · 6.5 kg</p>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-[12px] text-zinc-100">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden="true" />
            Drying
          </span>
        </div>
        <ol className="mt-5 flex items-center" aria-label="Order progress">
          {steps.map((s, i) => {
            const done = i < 2
            const current = i === 2
            return (
              <li key={s} className="flex flex-1 items-center last:flex-none">
                <span className="flex flex-col items-center">
                  <span
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full border text-[12px]',
                      done && 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
                      current && 'border-white/40 bg-white/[0.07] font-semibold text-white',
                      !done && !current && 'border-white/10 text-zinc-600'
                    )}
                  >
                    {done ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : i + 1}
                  </span>
                  <span className={cn('mt-1.5 text-[11px]', current ? 'font-medium text-white' : done ? 'text-zinc-400' : 'text-zinc-600')}>
                    {s}
                  </span>
                </span>
                {i < steps.length - 1 && (
                  <span className={cn('mx-1.5 mb-5 h-px flex-1', i < 2 ? 'bg-emerald-400/30' : 'bg-white/10')} aria-hidden="true" />
                )}
              </li>
            )
          })}
        </ol>
        <p className="mt-4 border-t border-white/[0.06] pt-3 font-mono text-[11px] text-zinc-600">
          Track: <span className="text-zinc-300">LF1042-X7Q2</span>
        </p>
      </WindowShell>
    </div>
  )
}
