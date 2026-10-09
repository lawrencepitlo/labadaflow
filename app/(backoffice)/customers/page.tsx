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
import { Plus, Users, SearchX, ChevronLeft, ChevronRight } from 'lucide-react'
import { NewCustomerForm } from './new-customer-form'
import { CustomersSearch } from './customers-search'

function buildPageHref(page: number, search?: string) {
  const qs = new URLSearchParams()
  if (page > 1) qs.set('page', String(page))
  if (search) qs.set('search', search)
  const s = qs.toString()
  return s ? `/customers?${s}` : '/customers'
}

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
  const hasSearch = Boolean(params.search)

  return (
    <>
      <PageHeader
        title="Customers"
        description={
          hasSearch
            ? `${total} matching customer${total === 1 ? '' : 's'}`
            : 'Manage customer records and their laundry history.'
        }
      >
        <Button render={<Link href="#new-customer" />}>
          <Plus aria-hidden="true" />
          New Customer
        </Button>
      </PageHeader>

      <CustomersSearch key={params.search ?? ''} currentSearch={params.search} />

      {customers.length === 0 ? (
        <div className="overflow-hidden rounded-lg border bg-card">
          <EmptyState
            icon={hasSearch ? SearchX : Users}
            title={hasSearch ? 'No matching customers' : 'No customers yet'}
            description={hasSearch ? 'No customers match this search. Try a different search.' : 'Add your first customer — every order needs one.'}
          />
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          {/* Desktop — Linear-style directory rows */}
          <div className="hidden md:block">
            <Table aria-label="Customers">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-8 pl-4 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Customer</TableHead>
                  <TableHead className="h-8 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Contact</TableHead>
                  <TableHead className="h-8 text-center text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Orders</TableHead>
                  <TableHead className="h-8 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Added</TableHead>
                  <TableHead className="h-8 w-10 pr-3">
                    <span className="sr-only">Open</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map(c => (
                  <TableRow key={c.id} className="group h-12 transition-colors duration-100 hover:bg-muted/40 focus-within:bg-muted/40">
                    <TableCell className="pl-4">
                      <span className="flex items-center gap-2">
                        <Link
                          href={`/customers/${c.id}`}
                          className="max-w-[14rem] truncate rounded text-[13px] font-medium text-foreground outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/40"
                        >
                          {c.full_name}
                        </Link>
                        {c.archived_at && (
                          <span className="shrink-0 rounded-md border px-1.5 py-0.5 text-[11px] text-muted-foreground">
                            Archived
                          </span>
                        )}
                      </span>
                      {c.email && (
                        <span className="mt-0.5 block max-w-[14rem] truncate text-xs text-muted-foreground">{c.email}</span>
                      )}
                    </TableCell>
                    <TableCell className="tnum text-[13px] text-muted-foreground">{c.phone ?? '—'}</TableCell>
                    <TableCell className="tnum text-center text-[13px]" title={`${c.order_count} order${c.order_count === 1 ? '' : 's'}`}>
                      {c.order_count}
                    </TableCell>
                    <TableCell className="tnum text-[13px] text-muted-foreground">{formatDate(c.created_at)}</TableCell>
                    <TableCell className="pr-3 text-right">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground/50 transition-colors duration-100 group-hover:text-foreground"
                        render={<Link href={`/customers/${c.id}`} aria-label={`Open customer ${c.full_name}`} />}
                      >
                        <ChevronRight aria-hidden="true" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile — same list, stacked rows */}
          <ul className="divide-y divide-border md:hidden" aria-label="Customers">
            {customers.map(c => (
              <li key={c.id}>
                <Link
                  href={`/customers/${c.id}`}
                  aria-label={`View customer ${c.full_name}`}
                  className="block px-4 py-3 outline-none transition-colors duration-100 hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/40 motion-reduce:transition-none"
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
                    <span className="tnum shrink-0 text-xs text-muted-foreground" title={`${c.order_count} order${c.order_count === 1 ? '' : 's'}`}>
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

          {/* List footer — count + pagination */}
          <div className="flex items-center justify-between gap-2 border-t bg-muted/20 px-3 py-2">
            <p className="tnum px-1 text-xs text-muted-foreground" aria-live="polite">
              {totalPages > 1 ? (
                <>Page {currentPage} of {totalPages} · {total} customers</>
              ) : (
                <>{total} customer{total === 1 ? '' : 's'}</>
              )}
            </p>
            {totalPages > 1 && (
              <nav className="flex items-center gap-1" aria-label="Customers pagination">
                {currentPage > 1 && (
                  <Button variant="ghost" size="sm" className="text-muted-foreground" render={<Link href={buildPageHref(currentPage - 1, params.search)} aria-label="Previous page" />}>
                    <ChevronLeft aria-hidden="true" />
                    Prev
                  </Button>
                )}
                {currentPage < totalPages && (
                  <Button variant="ghost" size="sm" className="text-muted-foreground" render={<Link href={buildPageHref(currentPage + 1, params.search)} aria-label="Next page" />}>
                    Next
                    <ChevronRight aria-hidden="true" />
                  </Button>
                )}
              </nav>
            )}
          </div>
        </div>
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
