import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { clientApi, invoiceApi } from '../../services/endpoints';
import { useDebounce } from '../../hooks/useDebounce';
import { usePageMeta } from '../../hooks/usePageMeta';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../utils/errors';
import { invalidateWorkspace } from '../../utils/query';
import { Plus } from 'lucide-react';
import { buttonClasses } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Fields';
import { Card } from '../../components/ui/Card';
import { Pagination } from '../../components/ui/Pagination';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/EmptyState';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { InvoiceTable } from '../../components/tables/InvoiceTable';
import { DOCUMENT_TYPES } from '../../content/india';
import { Button } from '../../components/ui/Button';

const initial = {
  page: 1,
  sort: 'issueDate',
  order: 'desc',
  status: '',
  documentType: '',
  client: '',
  from: '',
  to: '',
  minAmount: '',
  maxAmount: '',
  search: '',
};

export function InvoicesPage() {
  usePageMeta('Invoices', 'Search, filter, and manage invoices.');
  const [params] = useSearchParams();
  const [filters, setFilters] = useState({ ...initial, status: params.get('status') || '' });
  const [mobileFilters, setMobileFilters] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const debounced = useDebounce(filters.search, 300);
  const queryClient = useQueryClient();
  const { push } = useToast();

  const clients = useQuery({
    queryKey: ['clients', 'options'],
    queryFn: () => clientApi.list({ limit: 100, sort: 'name', order: 'asc' }).then((response) => response.data.data.items),
  });

  const query = useQuery({
    queryKey: ['invoices', { ...filters, search: debounced }],
    queryFn: () => invoiceApi.list({
      page: filters.page,
      sort: filters.sort,
      order: filters.order,
      status: filters.status || undefined,
      documentType: filters.documentType || undefined,
      client: filters.client || undefined,
      from: filters.from || undefined,
      to: filters.to || undefined,
      minAmount: filters.minAmount || undefined,
      maxAmount: filters.maxAmount || undefined,
      search: debounced || undefined,
    }).then((response) => response.data.data),
    placeholderData: keepPreviousData,
  });

  const remove = useMutation({
    mutationFn: (id) => invoiceApi.remove(id),
    onSuccess: async () => {
      await invalidateWorkspace(queryClient);
      push('Invoice deleted');
      setPendingDelete(null);
    },
    onError: (error) => push(getErrorMessage(error), 'error'),
  });

  function update(partial, resetPage = true) {
    setFilters((current) => ({ ...current, ...partial, page: resetPage ? 1 : partial.page || current.page }));
  }

  function onSort(field) {
    setFilters((current) => ({
      ...current,
      sort: field,
      order: current.sort === field && current.order === 'asc' ? 'desc' : 'asc',
      page: 1,
    }));
  }

  const filterFields = (
    <>
      <Select label="Document" value={filters.documentType} onChange={(event) => update({ documentType: event.target.value })}>
        <option value="">All documents</option>
        {DOCUMENT_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
      </Select>
      <Select label="Status" value={filters.status} onChange={(event) => update({ status: event.target.value })}>
        <option value="">All statuses</option>
        {['draft', 'sent', 'paid', 'overdue', 'cancelled'].map((status) => <option key={status} value={status}>{status}</option>)}
      </Select>
      <Select label="Client" value={filters.client} onChange={(event) => update({ client: event.target.value })}>
        <option value="">All clients</option>
        {(clients.data || []).map((client) => <option key={client._id} value={client._id}>{client.company || client.name}</option>)}
      </Select>
      <Input label="From" type="date" value={filters.from} onChange={(event) => update({ from: event.target.value })} />
      <Input label="To" type="date" value={filters.to} onChange={(event) => update({ to: event.target.value })} />
      <Input label="Min amount" inputMode="decimal" value={filters.minAmount} onChange={(event) => update({ minAmount: event.target.value })} />
      <Input label="Max amount" inputMode="decimal" value={filters.maxAmount} onChange={(event) => update({ maxAmount: event.target.value })} />
    </>
  );

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-ink">Invoices</h1>
          <p className="mt-1.5 text-sm text-muted">Create, manage and track your invoices.</p>
        </div>
        <Link to="/app/invoices/new" className={buttonClasses()}><Plus className="h-4 w-4" /> New invoice</Link>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Input label="Search" placeholder="Search invoices..." value={filters.search} onChange={(event) => update({ search: event.target.value })} />
        </div>
        <Button variant="secondary" className="md:hidden" onClick={() => setMobileFilters(true)}>Filters</Button>
        <Button variant="ghost" onClick={() => setFilters(initial)}>Clear</Button>
      </div>

      <div className="mt-3 hidden gap-3 md:grid md:grid-cols-3 xl:grid-cols-4">{filterFields}</div>
      {mobileFilters ? (
        <div className="mt-3 space-y-3 rounded-xl border border-line bg-white p-4 md:hidden">
          {filterFields}
          <Button className="w-full" onClick={() => setMobileFilters(false)}>Apply filters</Button>
        </div>
      ) : null}

      <Card className="mt-4 overflow-hidden">
        {query.isLoading ? <div className="space-y-3 p-4">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-10" />)}</div> : null}
        {query.isError ? <div className="p-4"><ErrorState message={getErrorMessage(query.error)} onRetry={() => query.refetch()} /></div> : null}
        {query.data ? (
          <>
            <div aria-busy={query.isFetching}>
              <InvoiceTable
                invoices={query.data.items}
                sort={filters.sort}
                order={filters.order}
                onSort={onSort}
                onDelete={setPendingDelete}
                filtered={Boolean(filters.search || filters.status || filters.documentType || filters.client || filters.from || filters.to || filters.minAmount || filters.maxAmount)}
              />
            </div>
            <Pagination
              page={query.data.pagination.page}
              pages={query.data.pagination.pages}
              total={query.data.pagination.total}
              label="invoices"
              onPage={(page) => update({ page }, false)}
            />
          </>
        ) : null}
      </Card>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete invoice?"
        description={pendingDelete ? `${pendingDelete.invoiceNumber} will be removed from this workspace.` : ''}
        confirmLabel="Delete invoice"
        loading={remove.isPending}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => remove.mutate(pendingDelete._id)}
      />
    </div>
  );
}
