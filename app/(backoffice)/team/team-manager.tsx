'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateUserRole, toggleUserActive } from '@/lib/actions/team'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
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
        <SelectTrigger className="w-[140px]" disabled={isPending} aria-label={`Role for ${member.full_name}`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ADMIN">Admin</SelectItem>
          <SelectItem value="STAFF">Staff</SelectItem>
          <SelectItem value="CUSTOMER">Customer</SelectItem>
        </SelectContent>
      </Select>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
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
        variant={member.is_active ? 'outline' : 'default'}
        size="sm"
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
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  )
}

export function TeamManager({ members }: { members: TeamMember[] }) {
  if (members.length === 0) {
    return <p className="text-sm text-muted-foreground">No team members.</p>
  }
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map(m => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">{m.full_name}</TableCell>
                <TableCell>{m.email}</TableCell>
                <TableCell><RoleSelect member={m} /></TableCell>
                <TableCell>
                  <Badge variant={m.is_active ? 'default' : 'secondary'}>
                    {m.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell><ActiveToggle member={m} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
