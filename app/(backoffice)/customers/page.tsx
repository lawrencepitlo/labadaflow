import Link from 'next/link'
import { getCustomers } from '@/lib/data/customers'
import { PageHeader } from '@/components/app/page-header'
import { EmptyState } from '@/components/app/empty-state'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  const page = Math.max(1, Number(params.page) || 1)
  const result = await getCustomers({
    search: params.search,
    page,
  })

  if (!result) {
    return <EmptyState title="Access Denied" description="You do not have permission to view customers." />
  }

  const { customers, total, page: currentPage, pageSize } = result
  const totalPages = Math.ceil(total / pageSize)

  return (
    <>
      <PageHeader
        title="Customers"
        description={params.search ? `${total} matching customer${total === 1 ? '' : 's'}` : `${total} active customer${total === 1 ? '' : 's'}`}
      >
        <Button render={<Link href="#new-customer" />}>
          <Plus aria-hidden="true" />
          New Customer
        </Button>
      </PageHeader>

      <CustomersSearch currentSearch={params.search} />

      {customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title={params.search ? 'No matching customers' : 'No customers yet'}
          description={params.search ? 'Try a different search.' : 'Add your first customer — every order needs one.'}
        />
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden gap-0 overflow-hidden py-0 md:block">
            <CardContent className="p-0">
              <Table aria-label="Customers">
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="pl-4 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Name</TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Phone</TableHead>
                    <TableHead className="hidden text-[11px] font-medium uppercase tracking-wider text-muted-foreground lg:table-cell">Email</TableHead>
                    <TableHead className="text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Orders</TableHead>
                    <TableHead className="pr-4 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map(c => (
                    <TableRow key={c.id} className="hover:bg-muted/40">
                      <TableCell className="pl-4">
                        <Link href={`/customers/${c.id}`} className="text-sm font-semibold text-primary hover:underline">
                          {c.full_name}
                        </Link>
                        {c.archived_at && (
                          <Badge variant="secondary" className="ml-2 text-[11px]">Archived</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground tabular-nums">{c.phone ?? '—'}</TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">{c.email ?? '—'}</TableCell>
                      <TableCell className="text-center">
                        <span
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-semibold tabular-nums"
                          title={`${c.order_count} orders`}
                          aria-label={`${c.full_name}: ${c.order_count} orders`}
                        >
                          {c.order_count}
                        </span>
                      </TableCell>
                      <TableCell className="pr-4 text-sm text-muted-foreground">{formatDate(c.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Mobile compact list */}
          <ul className="space-y-2 md:hidden">
            {customers.map(c => (
              <li key={c.id}>
                <Link
                  href={`/customers/${c.id}`}
                  aria-label={`View customer ${c.full_name}`}
                  className="block rounded-lg border bg-card p-3.5 outline-none transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring/40 motion-reduce:transition-none"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="min-w-0 truncate text-sm font-semibold text-primary">
                      {c.full_name}
                      {c.archived_at && (
                        <Badge variant="secondary" className="ml-2 align-middle text-[11px]">Archived</Badge>
                      )}
                    </p>
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold tabular-nums"
                      aria-label={`${c.order_count} orders`}
                    >
                      {c.order_count}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {c.phone ?? 'No phone'}{c.email ? ` · ${c.email}` : ''}
                  </p>
                </Link>
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <nav className="mt-6 flex items-center justify-center gap-3" aria-label="Customers pagination">
              {currentPage > 1 && (
                <Button variant="outline" size="sm" render={<Link href={`/customers?page=${currentPage - 1}${params.search ? `&search=${encodeURIComponent(params.search)}` : ''}`} aria-label="Previous page" />}>
                  <ChevronLeft aria-hidden="true" />
                  Previous
                </Button>
              )}
              <span className="text-sm text-muted-foreground tabular-nums" aria-live="polite">
                Page {currentPage} of {totalPages} · {total} customers
              </span>
              {currentPage < totalPages && (
                <Button variant="outline" size="sm" render={<Link href={`/customers?page=${currentPage + 1}${params.search ? `&search=${encodeURIComponent(params.search)}` : ''}`} aria-label="Next page" />}>
                  Next
                  <ChevronRight aria-hidden="true" />
                </Button>
              )}
            </nav>
          )}
        </>
      )}

      <Card id="new-customer" className="mt-6 scroll-mt-6">
        <CardHeader className="px-6 py-4">
          <CardTitle className="text-base">New Customer</CardTitle>
          <CardDescription>Walk-ins need a record before their first order</CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <NewCustomerForm />
        </CardContent>
      </Card>
    </>
  )
}
