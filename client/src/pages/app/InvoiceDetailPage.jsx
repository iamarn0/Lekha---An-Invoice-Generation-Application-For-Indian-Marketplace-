import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Copy, Download, Pencil, Send } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { activityApi, downloadInvoicePdf, invoiceApi } from '../../services/endpoints';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { usePageMeta } from '../../hooks/usePageMeta';
import { getErrorMessage } from '../../utils/errors';
import { invalidateWorkspace } from '../../utils/query';
import { Button } from '../../components/ui/Button';
import { Menu, MenuItem } from '../../components/ui/Menu';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/EmptyState';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { InvoicePreview } from '../../components/invoices/InvoicePreview';
import { ActivityFeed } from '../../components/dashboard/ActivityFeed';
import { Card, CardHeader } from '../../components/ui/Card';

export function InvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { push } = useToast();
  const queryClient = useQueryClient();
  const [confirm, setConfirm] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const query = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => invoiceApi.get(id).then((response) => response.data.data),
  });

  const activity = useQuery({
    queryKey: ['activity', 'invoice', id],
    queryFn: () => activityApi.list({ invoice: id, limit: 8 }).then((response) => response.data.data.items),
  });

  usePageMeta(query.data ? query.data.invoiceNumber : 'Invoice');

  const status = useMutation({
    mutationFn: (next) => invoiceApi.setStatus(id, next),
    onSuccess: async (_response, next) => {
      await invalidateWorkspace(queryClient);
      const labels = { paid: 'Invoice paid', overdue: 'Invoice marked overdue', draft: 'Moved back to draft', cancelled: 'Invoice cancelled' };
      push(labels[next] || 'Invoice updated');
      setConfirm(null);
    },
    onError: (error) => push(getErrorMessage(error), 'error'),
  });

  const send = useMutation({
    mutationFn: () => invoiceApi.send(id),
    onSuccess: async () => {
      await invalidateWorkspace(queryClient);
      push('Invoice sent');
    },
    onError: (error) => push(getErrorMessage(error), 'error'),
  });

  const convert = useMutation({
    mutationFn: () => invoiceApi.convert(id),
    onSuccess: async () => {
      await invalidateWorkspace(queryClient);
      push('Converted to a tax invoice');
    },
    onError: (error) => push(getErrorMessage(error), 'error'),
  });

  const duplicate = useMutation({
    mutationFn: () => invoiceApi.duplicate(id),
    onSuccess: async (response) => {
      await invalidateWorkspace(queryClient);
      push('Invoice duplicated');
      navigate(`/app/invoices/${response.data.data._id}`);
    },
    onError: (error) => push(getErrorMessage(error), 'error'),
  });

  const remove = useMutation({
    mutationFn: () => invoiceApi.remove(id),
    onSuccess: async () => {
      await invalidateWorkspace(queryClient);
      push('Invoice deleted');
      navigate('/app/invoices');
    },
    onError: (error) => push(getErrorMessage(error), 'error'),
  });

  async function onDownload() {
    setDownloading(true);
    try {
      await downloadInvoicePdf(query.data);
      push('PDF downloaded');
    } catch (error) {
      push(getErrorMessage(error), 'error');
    } finally {
      setDownloading(false);
    }
  }

  if (query.isLoading) return <Skeleton className="h-[640px]" />;
  if (query.isError) return <ErrorState message={getErrorMessage(query.error)} onRetry={() => query.refetch()} />;

  const invoice = query.data;
  const busy = status.isPending || send.isPending || duplicate.isPending || convert.isPending;

  return (
    <div>
      <Link to="/app/invoices" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Invoices
      </Link>
      <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[28px] font-semibold tracking-tight text-ink">Invoice {invoice.invoiceNumber}</h1>
            <Badge tone={invoice.status} />
          </div>
          <p className="mt-1 text-sm text-muted">Download the PDF or update the status as payment comes in.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" loading={downloading} onClick={onDownload}><Download className="h-4 w-4" /> Download PDF</Button>
          <Link to={`/app/invoices/${invoice._id}/edit`} className="inline-flex h-10 items-center gap-2 rounded-lg border border-line bg-white px-4 text-sm font-medium"><Pencil className="h-4 w-4" /> Edit</Link>
          {invoice.documentType && invoice.documentType !== 'tax_invoice' ? (
            <Button loading={convert.isPending} onClick={() => convert.mutate()}>Convert to tax invoice</Button>
          ) : null}
          {invoice.status === 'draft' ? <Button loading={send.isPending} onClick={() => send.mutate()}><Send className="h-4 w-4" /> Send invoice</Button> : null}
          {invoice.status === 'sent' || invoice.status === 'overdue' ? <Button loading={status.isPending} onClick={() => status.mutate('paid')}>Mark paid</Button> : null}
          <Menu label="More" buttonClassName="h-10 border border-line bg-white px-4 text-sm font-medium">
            <MenuItem onClick={() => duplicate.mutate()}><Copy className="h-4 w-4" /> Duplicate</MenuItem>
            {invoice.status !== 'draft' ? <MenuItem onClick={() => status.mutate('draft')}>Mark draft</MenuItem> : null}
            {invoice.status === 'sent' ? <MenuItem onClick={() => status.mutate('overdue')}>Mark overdue</MenuItem> : null}
            {invoice.status !== 'cancelled' && invoice.status !== 'paid' ? <MenuItem onClick={() => setConfirm('cancel')}>Cancel invoice</MenuItem> : null}
            <MenuItem className="text-red-700" onClick={() => setConfirm('delete')}>Delete</MenuItem>
          </Menu>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <InvoicePreview invoice={invoice} business={user} />
        <div className="space-y-4">
          <Card>
            <CardHeader title="Collect with Razorpay" description="Placeholder only. No charge is created." />
            <div className="space-y-3 px-5 pb-5 text-sm">
              <p className="text-muted">
                {user?.razorpayKeyId
                  ? `Public key ${user.razorpayKeyId} is saved. Live checkout is not connected.`
                  : 'Add a public Razorpay key ID in settings when you are ready. The secret key is never stored.'}
              </p>
              <Button
                variant="secondary"
                onClick={() => push(user?.razorpayKeyId ? 'Razorpay checkout is not connected yet.' : 'Add a Razorpay key ID in settings first.', 'error')}
              >
                Pay with Razorpay
              </Button>
            </div>
          </Card>
          <Card>
            <CardHeader title="Activity" />
            <ActivityFeed items={activity.data} empty="No history for this invoice yet." />
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirm === 'delete'}
        title="Delete invoice?"
        description={`${invoice.invoiceNumber} will be removed from this workspace.`}
        confirmLabel="Delete invoice"
        loading={remove.isPending}
        onClose={() => setConfirm(null)}
        onConfirm={() => remove.mutate()}
      />
      <ConfirmDialog
        open={confirm === 'cancel'}
        title="Cancel invoice?"
        description="Cancelled invoices stay in the list and no longer count as outstanding."
        confirmLabel="Cancel invoice"
        loading={status.isPending}
        onClose={() => setConfirm(null)}
        onConfirm={() => status.mutate('cancelled')}
      />
      {busy ? <span className="sr-only">Updating invoice</span> : null}
    </div>
  );
}
