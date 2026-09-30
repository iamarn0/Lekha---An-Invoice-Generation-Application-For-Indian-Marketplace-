import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { clientApi } from '../../services/endpoints';
import { useDebounce } from '../../hooks/useDebounce';
import { usePageMeta } from '../../hooks/usePageMeta';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../utils/errors';
import { invalidateWorkspace } from '../../utils/query';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Fields';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Pagination } from '../../components/ui/Pagination';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/EmptyState';
import { ClientForm } from '../../components/forms/ClientForm';
import { ClientTable } from '../../components/tables/ClientTable';

export function ClientsPage() {
  usePageMeta('Clients', 'Search, filter, and manage the clients you invoice.');
  const [params, setParams] = useSearchParams();
  const [filters, setFilters] = useState({ page: 1, sort: 'name', order: 'asc', status: '', search: '' });
  const [editor, setEditor] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const debounced = useDebounce(filters.search, 300);
  const queryClient = useQueryClient();
  const { push } = useToast();

  const query = useQuery({
    queryKey: ['clients', { ...filters, search: debounced }],
    queryFn: () => clientApi.list({
      page: filters.page,
      sort: filters.sort,
      order: filters.order,
      status: filters.status || undefined,
      search: debounced || undefined,
    }).then((response) => response.data.data),
    placeholderData: keepPreviousData,
  });

  const save = useMutation({
    mutationFn: (values) => (editor?._id ? clientApi.update(editor._id, values) : clientApi.create(values)),
    onSuccess: async () => {
      await invalidateWorkspace(queryClient);
      push(editor?._id ? 'Client updated' : 'Client created');
      setEditor(null);
    },
    onError: (error) => push(getErrorMessage(error), 'error'),
  });

  const remove = useMutation({
    mutationFn: (id) => clientApi.remove(id),
    onSuccess: async () => {
      await invalidateWorkspace(queryClient);
      push('Client deleted');
      setPendingDelete(null);
    },
    onError: (error) => push(getErrorMessage(error), 'error'),
  });

  const deactivate = useMutation({
    mutationFn: (client) => clientApi.update(client._id, { ...client, status: 'inactive' }),
    onSuccess: async () => {
      await invalidateWorkspace(queryClient);
      push('Client marked inactive');
      setPendingDelete(null);
    },
    onError: (error) => push(getErrorMessage(error), 'error'),
  });

  useEffect(() => {
    if (params.get('new') === '1') {
      setEditor({});
      setParams({}, { replace: true });
    }
  }, [params, setParams]);

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

  const filtered = Boolean(filters.search || filters.status);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-ink">Clients</h1>
          <p className="mt-1.5 text-sm text-muted">Manage your customers and their invoice history.</p>
        </div>
        <Button onClick={() => setEditor({})}><Plus className="h-4 w-4" /> Add client</Button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_12rem_auto]">
        <Input label="Search" placeholder="Search clients..." value={filters.search} onChange={(event) => update({ search: event.target.value })} />
        <Select label="Filter" value={filters.status} onChange={(event) => update({ status: event.target.value })}>
          <option value="">All clients</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="outstanding">Outstanding</option>
        </Select>
        <div className="flex items-end">
          <Button variant="ghost" onClick={() => setFilters({ page: 1, sort: 'name', order: 'asc', status: '', search: '' })}>Clear</Button>
        </div>
      </div>

      <Card className="mt-4 overflow-hidden">
        {query.isLoading ? <div className="space-y-3 p-4">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-10" />)}</div> : null}
        {query.isError ? <div className="p-4"><ErrorState message={getErrorMessage(query.error)} onRetry={() => query.refetch()} /></div> : null}
        {query.data ? (
          <>
            <div aria-busy={query.isFetching}>
              <ClientTable
                clients={query.data.items}
                sort={filters.sort}
                order={filters.order}
                onSort={onSort}
                onEdit={setEditor}
                onDelete={setPendingDelete}
                onCreate={() => setEditor({})}
                filtered={filtered}
              />
            </div>
            <Pagination
              page={query.data.pagination.page}
              pages={query.data.pagination.pages}
              total={query.data.pagination.total}
              label="clients"
              onPage={(page) => update({ page }, false)}
            />
          </>
        ) : null}
      </Card>

      <Modal open={Boolean(editor)} title={editor?._id ? 'Edit client' : 'New client'} onClose={() => setEditor(null)}>
        {editor ? (
          <ClientForm
            key={editor._id || 'new'}
            initial={editor}
            submitting={save.isPending}
            submitLabel={editor._id ? 'Save changes' : 'Create client'}
            onCancel={() => setEditor(null)}
            onSubmit={(values) => save.mutate(values)}
          />
        ) : null}
      </Modal>

      <Modal open={Boolean(pendingDelete)} title="Delete client?" onClose={() => setPendingDelete(null)}>
        <p className="text-sm leading-6 text-muted">
          {pendingDelete ? `${pendingDelete.name} can be deleted only when they have no invoices. Otherwise, mark them inactive.` : ''}
        </p>
        {remove.isError ? <p role="alert" className="mt-3 text-sm text-red-700">{getErrorMessage(remove.error)}</p> : null}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => setPendingDelete(null)}>Cancel</Button>
          <Button variant="secondary" loading={deactivate.isPending} onClick={() => deactivate.mutate(pendingDelete)}>Mark inactive</Button>
          <Button variant="danger" loading={remove.isPending} onClick={() => remove.mutate(pendingDelete._id)}>Delete client</Button>
        </div>
      </Modal>
    </div>
  );
}
