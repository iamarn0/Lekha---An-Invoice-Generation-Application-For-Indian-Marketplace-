import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Mail, MapPin, Phone, Plus } from 'lucide-react';
import { clientApi, invoiceApi } from '../../services/endpoints';
import { useMoney } from '../../hooks/useMoney';
import { usePageMeta } from '../../hooks/usePageMeta';
import { useToast } from '../../context/ToastContext';
import { formatDate } from '../../utils/format';
import { stateName } from '../../content/india';
import { getErrorMessage } from '../../utils/errors';
import { invalidateWorkspace } from '../../utils/query';
import { Badge } from '../../components/ui/Badge';
import { Button, buttonClasses } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/EmptyState';
import { ClientForm } from '../../components/forms/ClientForm';

export function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const money = useMoney();
  const { push } = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const clientQuery = useQuery({
    queryKey: ['client', id],
    queryFn: () => clientApi.get(id).then((response) => response.data.data),
  });

  const invoicesQuery = useQuery({
    queryKey: ['invoices', 'client', id],
    queryFn: () => invoiceApi.list({ client: id, limit: 100, sort: 'issueDate', order: 'desc' }).then((response) => response.data.data),
  });

  usePageMeta(clientQuery.data?.name || 'Client');

  const save = useMutation({
    mutationFn: (values) => clientApi.update(id, values),
    onSuccess: async () => {
      await invalidateWorkspace(queryClient);
      push('Client updated');
      setEditing(false);
    },
    onError: (error) => push(getErrorMessage(error), 'error'),
  });

  const remove = useMutation({
    mutationFn: () => clientApi.remove(id),
    onSuccess: async () => {
      await invalidateWorkspace(queryClient);
      push('Client deleted');
      navigate('/app/clients');
    },
    onError: (error) => push(getErrorMessage(error), 'error'),
  });

  const toggleStatus = useMutation({
    mutationFn: (status) => clientApi.update(id, { ...clientQuery.data, status }),
    onSuccess: async () => {
      await invalidateWorkspace(queryClient);
      push('Client updated');
      setConfirming(false);
    },
    onError: (error) => push(getErrorMessage(error), 'error'),
  });

  if (clientQuery.isLoading) return <Skeleton className="h-80" />;
  if (clientQuery.isError) return <ErrorState message={getErrorMessage(clientQuery.error)} onRetry={() => clientQuery.refetch()} />;

  const client = clientQuery.data;
  const invoicePage = invoicesQuery.data;
  const invoices = invoicePage?.items || [];
  const historyComplete = invoicePage ? invoices.length >= (invoicePage.pagination?.total || invoices.length) : false;
  const totalInvoiced = historyComplete ? invoices.reduce((sum, invoice) => sum + (Number(invoice.grandTotal) || 0), 0) : null;
  const paidTotal = historyComplete
    ? invoices.filter((invoice) => invoice.status === 'paid').reduce((sum, invoice) => sum + (Number(invoice.grandTotal) || 0), 0)
    : null;
  const displayName = client.company || client.name;

  return (
    <div>
      <Link to="/app/clients" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Clients
      </Link>
      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[28px] font-semibold tracking-tight text-ink">{displayName}</h1>
            <Badge tone={client.status} />
          </div>
          {client.company && client.name ? <p className="mt-1 text-sm text-muted">{client.name}</p> : null}
          <p className="mt-1 text-sm text-muted">{client.email}</p>
          {client.gstin ? <p className="mt-1 text-sm text-muted">GSTIN {client.gstin}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={`/app/invoices/new?client=${client._id}`} className={buttonClasses()}><Plus className="h-4 w-4" /> New invoice</Link>
          <Button variant="secondary" onClick={() => setEditing(true)}>Edit</Button>
          <Button variant="secondary" onClick={() => toggleStatus.mutate(client.status === 'active' ? 'inactive' : 'active')}>
            {client.status === 'active' ? 'Mark inactive' : 'Mark active'}
          </Button>
          <Button variant="danger" onClick={() => setConfirming(true)}>Delete</Button>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Stat label="Total invoiced" value={totalInvoiced === null ? '—' : money(totalInvoiced)} />
        <Stat label="Paid" value={paidTotal === null ? '—' : money(paidTotal)} />
        <Stat label="Outstanding" value={money(client.outstanding || 0)} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-1">
          <p className="text-sm font-medium text-ink">Contact</p>
          <ul className="mt-5 space-y-3 text-sm text-ink">
            <li className="flex gap-2"><Mail className="mt-0.5 h-4 w-4 text-muted" aria-hidden="true" /> {client.email}</li>
            {client.phone ? <li className="flex gap-2"><Phone className="mt-0.5 h-4 w-4 text-muted" aria-hidden="true" /> {client.phone}</li> : null}
            {client.address ? <li className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden="true" /><span className="whitespace-pre-line">{client.address}</span></li> : null}
            {client.state ? <li className="text-sm text-muted">{stateName(client.state)}</li> : null}
            {client.gstin ? <li className="text-sm">GSTIN {client.gstin}</li> : null}
            {client.pan ? <li className="text-sm">PAN {client.pan}</li> : null}
          </ul>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader title="Invoice history" />
          {invoicesQuery.isLoading ? <Skeleton className="m-4 h-24" /> : null}
          {invoices.length === 0 && !invoicesQuery.isLoading ? (
            <p className="px-5 py-10 text-sm text-muted">No invoices for this client yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {invoices.map((invoice) => (
                <li key={invoice._id}>
                  <Link to={`/app/invoices/${invoice._id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-mist">
                    <span>
                      <span className="block text-sm font-medium text-navy-900">{invoice.invoiceNumber}</span>
                      <span className="text-xs text-muted">{formatDate(invoice.issueDate)}</span>
                    </span>
                    <span className="text-right">
                      <span className="block text-sm font-medium">{money(invoice.grandTotal)}</span>
                      <Badge tone={invoice.status} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Modal open={editing} title="Edit client" onClose={() => setEditing(false)}>
        <ClientForm
          initial={client}
          submitting={save.isPending}
          onCancel={() => setEditing(false)}
          onSubmit={(values) => save.mutate(values)}
        />
      </Modal>

      <Modal open={confirming} title="Delete client?" onClose={() => setConfirming(false)}>
        <p className="text-sm leading-6 text-muted">
          {client.name} can be deleted only when they have no invoices. If invoices exist, mark the client inactive instead.
        </p>
        {remove.isError ? <p role="alert" className="mt-3 text-sm text-red-700">{getErrorMessage(remove.error)}</p> : null}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => setConfirming(false)}>Cancel</Button>
          <Button variant="secondary" loading={toggleStatus.isPending} onClick={() => toggleStatus.mutate('inactive')}>Mark inactive</Button>
          <Button variant="danger" loading={remove.isPending} onClick={() => remove.mutate()}>Delete client</Button>
        </div>
      </Modal>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-line bg-white p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="num mt-2 text-2xl font-semibold tracking-tight text-ink">{value}</p>
    </div>
  );
}
