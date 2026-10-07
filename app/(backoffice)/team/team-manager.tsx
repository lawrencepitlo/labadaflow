'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateUserRole, toggleUserActive } from '@/lib/actions/team'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
        <SelectTrigger className="w-[128px]" disabled={isPending} aria-label={`Role for ${member.full_name}`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ADMIN">Admin</SelectItem>
          <SelectItem value="STAFF">Staff</SelectItem>
          <SelectItem value="CUSTOMER">Customer</SelectItem>
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
        className="text-muted-foreground"
        disabled={isPending}
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
      <EmptyState
        icon={Users}
        title="No team members yet"
        description="Team members will appear here once they sign in."
      />
    )
  }

  const activeCount = members.filter(m => m.is_active).length

  return (
    <>
      {/* Desktop table */}
      <Card className="hidden gap-0 overflow-hidden py-0 md:block">
        <CardHeader className="px-4 py-3">
          <CardTitle className="text-[13px]">Members</CardTitle>
          <CardDescription>{activeCount} active · {members.length} total — role changes apply immediately</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table aria-label="Team members">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-9 pl-4 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Name</TableHead>
                <TableHead className="h-9 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Email</TableHead>
                <TableHead className="h-9 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Role</TableHead>
                <TableHead className="h-9 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Status</TableHead>
                <TableHead className="h-9 pr-4 text-right text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map(m => (
                <TableRow key={m.id} className={`h-12 hover:bg-muted/40 ${m.is_active ? '' : 'opacity-60'}`}>
                  <TableCell className="pl-4 text-[13px] font-medium">{m.full_name}</TableCell>
                  <TableCell className="max-w-[14rem] truncate text-[13px] text-muted-foreground">{m.email}</TableCell>
                  <TableCell><RoleSelect member={m} /></TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1.5 text-xs ${m.is_active ? 'text-foreground' : 'text-muted-foreground'}`} aria-label={m.is_active ? `${m.full_name} active` : `${m.full_name} inactive`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${m.is_active ? 'bg-green-500' : 'bg-muted-foreground/40'}`} aria-hidden="true" />
                      {m.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell className="pr-4 text-right"><ActiveToggle member={m} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Mobile compact list */}
      <ul className="space-y-2 md:hidden" aria-label="Team members">
        {members.map(m => (
          <li
            key={m.id}
            className={`rounded-lg border bg-card p-3 ${m.is_active ? '' : 'opacity-70'}`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="min-w-0 truncate text-[13px] font-medium">{m.full_name}</p>
              <span className={`inline-flex shrink-0 items-center gap-1.5 text-xs ${m.is_active ? 'text-foreground' : 'text-muted-foreground'}`} aria-label={m.is_active ? `${m.full_name} active` : `${m.full_name} inactive`}>
                <span className={`h-1.5 w-1.5 rounded-full ${m.is_active ? 'bg-green-500' : 'bg-muted-foreground/40'}`} aria-hidden="true" />
                {m.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{m.email}</p>
            <div className="mt-2.5 flex items-center justify-between gap-2">
              <RoleSelect member={m} />
              <ActiveToggle member={m} />
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
