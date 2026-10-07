import Link from 'next/link'
import { getCustomers } from '@/lib/data/customers'
import { PageHeader } from '@/components/app/page-header'
import { EmptyState } from '@/components/app/empty-state'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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

      <CustomersSearch key={params.search ?? ''} currentSearch={params.search} />

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
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="h-9 pl-4 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Name</TableHead>
                    <TableHead className="h-9 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Phone</TableHead>
                    <TableHead className="hidden h-9 text-[11px] font-medium tracking-wide text-muted-foreground uppercase lg:table-cell">Email</TableHead>
                    <TableHead className="h-9 text-center text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Orders</TableHead>
                    <TableHead className="h-9 pr-4 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map(c => (
                    <TableRow key={c.id} className="h-12 hover:bg-muted/40">
                      <TableCell className="pl-4">
                        <span className="flex items-center gap-2">
                          <Link href={`/customers/${c.id}`} className="truncate text-[13px] font-medium text-foreground hover:underline">
                            {c.full_name}
                          </Link>
                          {c.archived_at && (
                            <span className="shrink-0 rounded-md border px-1.5 py-0.5 text-[11px] text-muted-foreground">
                              Archived
                            </span>
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="tnum text-[13px] text-muted-foreground">{c.phone ?? '—'}</TableCell>
                      <TableCell className="hidden max-w-[12rem] truncate text-[13px] text-muted-foreground lg:table-cell">{c.email ?? '—'}</TableCell>
                      <TableCell className="tnum text-center text-[13px]" title={`${c.order_count} orders`}>
                        {c.order_count}
                      </TableCell>
                      <TableCell className="tnum pr-4 text-[13px] text-muted-foreground">{formatDate(c.created_at)}</TableCell>
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
                  className="block rounded-lg border bg-card p-3 outline-none transition-colors duration-100 hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring/40 motion-reduce:transition-none"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="flex min-w-0 items-center gap-2 truncate text-[13px] font-medium">
                      <span className="truncate">{c.full_name}</span>
                      {c.archived_at && (
                        <span className="shrink-0 rounded-md border px-1.5 py-0.5 text-[11px] font-normal text-muted-foreground">
                          Archived
                        </span>
                      )}
                    </p>
                    <span className="tnum shrink-0 text-[13px] text-muted-foreground">
                      {c.order_count} order{c.order_count === 1 ? '' : 's'}
                    </span>
                  </div>
                  <p className="tnum mt-1 truncate text-xs text-muted-foreground">
                    {c.phone ?? 'No phone'}{c.email ? ` · ${c.email}` : ''}
                  </p>
                </Link>
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <nav className="mt-4 flex items-center justify-center gap-1" aria-label="Customers pagination">
              {currentPage > 1 && (
                <Button variant="ghost" size="sm" className="text-muted-foreground" render={<Link href={`/customers?page=${currentPage - 1}${params.search ? `&search=${encodeURIComponent(params.search)}` : ''}`} aria-label="Previous page" />}>
                  <ChevronLeft aria-hidden="true" />
                  Prev
                </Button>
              )}
              <span className="tnum px-2 text-xs text-muted-foreground" aria-live="polite">
                Page {currentPage} of {totalPages} · {total} customers
              </span>
              {currentPage < totalPages && (
                <Button variant="ghost" size="sm" className="text-muted-foreground" render={<Link href={`/customers?page=${currentPage + 1}${params.search ? `&search=${encodeURIComponent(params.search)}` : ''}`} aria-label="Next page" />}>
                  Next
                  <ChevronRight aria-hidden="true" />
                </Button>
              )}
            </nav>
          )}
        </>
      )}

      <Card id="new-customer" className="mt-4 scroll-mt-4 gap-0 py-0">
        <CardHeader className="px-4 py-3">
          <CardTitle className="text-[13px]">New Customer</CardTitle>
          <CardDescription>Walk-ins need a record before their first order</CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <NewCustomerForm />
        </CardContent>
      </Card>
    </>
  )
}
