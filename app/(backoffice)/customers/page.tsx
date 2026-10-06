import Link from 'next/link'
import { getCustomers } from '@/lib/data/customers'
import { PageHeader } from '@/components/app/page-header'
import { EmptyState } from '@/components/app/empty-state'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { formatDate } from '@/lib/time'
import { Plus, Users, ChevronLeft, ChevronRight } from 'lucide-react'
import { NewCustomerForm } from './new-customer-form'
import { CustomersSearch } from './customers-search'

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>
}) {
  const params = await searchParams
  const result = await getCustomers({
    search: params.search,
    page: params.page ? Number(params.page) : 1,
  })

  if (!result) {
    return <EmptyState title="Access Denied" description="You do not have permission to view customers." />
  }

  const { customers, total, page, pageSize } = result
  const totalPages = Math.ceil(total / pageSize)

  return (
    <>
      <PageHeader title="Customers" description={`${total} total customers`}>
        <Button render={<Link href="#new-customer" />}>
          <Plus className="w-4 h-4 mr-1.5" />
          New Customer
        </Button>
      </PageHeader>

      <CustomersSearch currentSearch={params.search} />

      {customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No customers found"
          description={params.search ? 'Try a different search.' : 'Create your first customer to get started.'}
        />
      ) : (
        <>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="font-semibold pl-6">Name</TableHead>
                    <TableHead className="font-semibold">Phone</TableHead>
                    <TableHead className="font-semibold">Email</TableHead>
                    <TableHead className="font-semibold text-center">Orders</TableHead>
                    <TableHead className="font-semibold pr-6">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map(c => (
                    <TableRow key={c.id} className="hover:bg-accent/30 transition-colors">
                      <TableCell className="pl-6">
                        <Link href={`/customers/${c.id}`} className="font-semibold text-primary hover:underline">
                          {c.full_name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{c.phone ?? '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{c.email ?? '—'}</TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-semibold">
                          {c.order_count}
                        </span>
                      </TableCell>
                      <TableCell className="pr-6 text-muted-foreground text-sm">{formatDate(c.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              {page > 1 && (
                <Button variant="outline" size="sm" render={<Link href={`/customers?page=${page - 1}${params.search ? `&search=${params.search}` : ''}`} />}>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
              )}
              <span className="text-sm text-muted-foreground font-medium">Page {page} of {totalPages}</span>
              {page < totalPages && (
                <Button variant="outline" size="sm" render={<Link href={`/customers?page=${page + 1}${params.search ? `&search=${params.search}` : ''}`} />}>
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          )}
        </>
      )}

      <div id="new-customer" className="mt-12">
        <h2 className="text-xl font-bold mb-4">New Customer</h2>
        <NewCustomerForm />
      </div>
    </>
  )
}
