import { getTeamMembers } from '@/lib/data/team'
import { getActor, hasRole } from '@/lib/auth'
import { PageHeader } from '@/components/app/page-header'
import { EmptyState } from '@/components/app/empty-state'
import { TeamManager } from './team-manager'

export default async function TeamPage() {
  const actor = await getActor()

  if (!actor || !hasRole(actor, 'ADMIN')) {
    return <EmptyState title="Access Denied" description="Only admins can manage the team." />
  }

  const members = await getTeamMembers()
  const activeCount = members.filter(m => m.is_active).length

  return (
    <>
      <PageHeader
        title="Team"
        description={`${activeCount} active · ${members.length} total — roles and status apply immediately`}
      />
      <TeamManager members={members} />
    </>
  )
}
