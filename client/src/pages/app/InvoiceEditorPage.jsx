import { useMemo } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { clientApi, invoiceApi } from '../../services/endpoints';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { usePageMeta } from '../../hooks/usePageMeta';
import { addDaysInput, toDateInput } from '../../utils/format';
import { getErrorMessage } from '../../utils/errors';
import { invalidateWorkspace } from '../../utils/query';
import { ArrowLeft } from 'lucide-react';
import { InvoiceForm } from '../../components/forms/InvoiceForm';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/EmptyState';

function blankInvoice(user, clientId = '', clients = []) {
  const selected = clients.find((client) => client._id === clientId);
  return {
    client: clientId,
    issueDate: toDateInput(),
    dueDate: addDaysInput(14),
    documentType: 'tax_invoice',
    placeOfSupply: selected?.state || user?.state || '',
    items: [{ description: '', quantity: '1', unitPrice: '', hsn: '' }],
    taxRate: String(user?.taxRate ?? 18),
    discount: '0',
    discountType: 'percent',
    notes: '',
    status: 'draft',
  };
}

function fromInvoice(invoice) {
  return {
    client: invoice.client?._id || invoice.client || '',
    issueDate: toDateInput(invoice.issueDate),
    dueDate: toDateInput(invoice.dueDate),
    documentType: invoice.documentType || 'tax_invoice',
    placeOfSupply: invoice.placeOfSupply || '',
    items: invoice.items.map((item) => ({
      description: item.description,
      hsn: item.hsn || '',
      quantity: String(item.quantity),
      unitPrice: String(item.unitPrice),
    })),
    taxRate: String(invoice.taxRate ?? 0),
    discount: String(invoice.discount ?? 0),
    discountType: invoice.discountType || 'percent',
    notes: invoice.notes || '',
    status: invoice.status,
  };
}

function toPayload(values) {
  return {
    client: values.client,
    issueDate: values.issueDate,
    dueDate: values.dueDate,
    status: values.status,
    documentType: values.documentType || 'tax_invoice',
    placeOfSupply: values.placeOfSupply || '',
    taxRate: Number(values.taxRate) || 0,
    discount: Number(values.discount) || 0,
    discountType: values.discountType,
    notes: values.notes,
    items: values.items.map((item) => ({
      description: item.description.trim(),
      hsn: String(item.hsn || '').trim(),
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
    })),
  };
}

export function InvoiceEditorPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { push } = useToast();
  const queryClient = useQueryClient();
  usePageMeta(isEdit ? 'Edit invoice' : 'New invoice');

  const invoiceQuery = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => invoiceApi.get(id).then((response) => response.data.data),
    enabled: isEdit,
  });

  const clientsQuery = useQuery({
    queryKey: ['clients', 'options'],
    queryFn: () => clientApi.list({ limit: 100, sort: 'name', order: 'asc' }).then((response) => response.data.data.items),
  });

  const initial = useMemo(() => {
    if (isEdit && invoiceQuery.data) return fromInvoice(invoiceQuery.data);
    return blankInvoice(user, params.get('client') || '', clientsQuery.data || []);
  }, [isEdit, invoiceQuery.data, user, params, clientsQuery.data]);

  const save = useMutation({
    mutationFn: (values) => (isEdit ? invoiceApi.update(id, toPayload(values)) : invoiceApi.create(toPayload(values))),
    onSuccess: async (response) => {
      await invalidateWorkspace(queryClient);
      push(isEdit ? 'Invoice updated' : 'Invoice created');
      navigate(`/app/invoices/${response.data.data._id}`);
    },
    onError: (error) => push(getErrorMessage(error), 'error'),
  });

  if ((isEdit && invoiceQuery.isLoading) || clientsQuery.isLoading) {
    return <div className="space-y-3"><Skeleton className="h-10 w-48" /><Skeleton className="h-96" /></div>;
  }
  if (invoiceQuery.isError) return <ErrorState message={getErrorMessage(invoiceQuery.error)} onRetry={() => invoiceQuery.refetch()} />;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link to={isEdit ? `/app/invoices/${id}` : '/app/invoices'} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {isEdit ? 'Back to invoice' : 'Back to invoices'}
          </Link>
          <h1 className="mt-3 text-[28px] font-semibold tracking-tight text-ink">{isEdit ? `Edit ${invoiceQuery.data.invoiceNumber}` : 'Create invoice'}</h1>
          <p className="mt-1 text-sm text-muted">GST follows your state and the place of supply.</p>
        </div>
        <Badge tone={isEdit ? invoiceQuery.data.status : 'draft'} />
      </div>
      <InvoiceForm
        key={isEdit ? invoiceQuery.data._id : `new-${params.get('client') || 'blank'}`}
        initial={initial}
        clients={clientsQuery.data || []}
        invoiceNumber={isEdit ? invoiceQuery.data.invoiceNumber : ''}
        sellerState={user?.state || ''}
        business={user}
        submitting={save.isPending}
        onSubmit={(values) => save.mutate(values)}
      />
    </div>
  );
}
