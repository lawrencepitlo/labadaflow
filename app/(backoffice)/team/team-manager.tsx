'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateUserRole, toggleUserActive } from '@/lib/actions/team'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { EmptyState } from '@/components/app/empty-state'
import { Users } from 'lucide-react'
import type { TeamMember } from '@/lib/data/team'

export function RoleSelect({ member }: { member: TeamMember }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <div>
      <Select
        defaultValue={member.role}
        onValueChange={value => {
          setError(null)
          startTransition(async () => {
            const result = await updateUserRole(member.id, value as TeamMember['role'])
            if (result?.error) setError(result.error)
            else router.refresh()
          })
        }}
      >
        <SelectTrigger className="w-[128px] h-8 text-xs font-medium" disabled={isPending} aria-label={`Role for ${member.full_name}`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ADMIN" className="text-xs">Admin</SelectItem>
          <SelectItem value="STAFF" className="text-xs">Staff</SelectItem>
          <SelectItem value="CUSTOMER" className="text-xs">Customer</SelectItem>
        </SelectContent>
      </Select>
      {error && <p className="mt-1 text-xs text-destructive" role="alert">{error}</p>}
    </div>
  )
}

export function ActiveToggle({ member }: { member: TeamMember }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        className={`text-xs ${member.is_active ? 'text-muted-foreground hover:text-destructive' : 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-700'}`}
        disabled={isPending}
        aria-label={`${member.is_active ? 'Deactivate' : 'Activate'} ${member.full_name}`}
        onClick={() => {
          setError(null)
          startTransition(async () => {
            const result = await toggleUserActive(member.id, !member.is_active)
            if (result?.error) setError(result.error)
            else router.refresh()
          })
        }}
      >
        {member.is_active ? 'Deactivate' : 'Activate'}
      </Button>
      {error && <p className="mt-1 text-xs text-destructive" role="alert">{error}</p>}
    </div>
  )
}

export function TeamManager({ members }: { members: TeamMember[] }) {
  if (members.length === 0) {
    return (
      <div className="mt-6 overflow-hidden rounded-2xl border border-border/80 bg-card p-8">
        <EmptyState
          icon={Users}
          title="No team members yet"
          description="Team members will appear here once they sign in to the application."
        />
      </div>
    )
  }

  const activeCount = members.filter(m => m.is_active).length

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 border-b pb-4">
        <div>
          <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Shop Personnel</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Manage administrative access, front-counter staff, and active privileges</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-medium text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-md">
            {activeCount} of {members.length} active
          </span>
        </div>
      </div>

      {/* Desktop — Clean SaaS table */}
      <div className="hidden overflow-x-auto rounded-xl border border-border/70 md:block">
        <Table aria-label="Team members">
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-10 pl-4 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Member Name & Email</TableHead>
              <TableHead className="h-10 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">System Role</TableHead>
              <TableHead className="h-10 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Status</TableHead>
              <TableHead className="h-10 pr-4 text-right text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map(m => (
              <TableRow key={m.id} className={`transition-colors duration-150 hover:bg-muted/40 ${m.is_active ? '' : 'opacity-60 bg-muted/10'}`}>
                <TableCell className="pl-4 py-3.5">
                  <div className="font-semibold text-foreground text-sm">{m.full_name}</div>
                  <div className="mt-0.5 font-mono text-xs text-muted-foreground">{m.email}</div>
                </TableCell>
                <TableCell className="py-3.5">
                  <RoleSelect member={m} />
                </TableCell>
                <TableCell className="py-3.5">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    m.is_active 
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20' 
                      : 'bg-muted text-muted-foreground border border-border'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${m.is_active ? 'bg-emerald-500' : 'bg-muted-foreground/50'}`} aria-hidden="true" />
                    {m.is_active ? 'Active' : 'Inactive'}
                  </span>
                </TableCell>
                <TableCell className="pr-4 text-right py-3.5">
                  <ActiveToggle member={m} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile — stacked list */}
      <div className="divide-y divide-border/60 rounded-xl border border-border/70 md:hidden mt-2">
        {members.map(m => (
          <div key={m.id} className={`p-4 ${m.is_active ? '' : 'opacity-60 bg-muted/10'}`}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-foreground text-sm">{m.full_name}</p>
                <p className="mt-0.5 font-mono text-xs text-muted-foreground truncate max-w-[200px]">{m.email}</p>
              </div>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium shrink-0 ${
                m.is_active 
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20' 
                  : 'bg-muted text-muted-foreground border border-border'
              }`}>
                {m.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="mt-3.5 flex items-center justify-between border-t pt-3">
              <RoleSelect member={m} />
              <ActiveToggle member={m} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
