import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { Input, Select, Textarea } from '../ui/Fields';
import { Button } from '../ui/Button';
import { InvoiceDraftPreview } from '../invoices/InvoiceDraftPreview';
import { calculateInvoice } from '../../utils/invoiceMath';
import { useMoney } from '../../hooks/useMoney';
import { DOCUMENT_TYPES, GST_SLABS, INDIAN_STATES, supplyLabel, supplyTypeFor } from '../../content/india';

const statuses = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];

export function InvoiceForm({ initial, clients, submitting, onSubmit, invoiceNumber, sellerState = '', business = null }) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const money = useMoney();
  const supplyType = supplyTypeFor(sellerState, values.placeOfSupply);
  const totals = calculateInvoice({
    ...values,
    taxRate: Number(values.taxRate) || 0,
    discount: Number(values.discount) || 0,
    supplyType,
    documentType: values.documentType,
    status: values.status,
  });
  const gstOptions = GST_SLABS.includes(Number(values.taxRate)) ? GST_SLABS : [Number(values.taxRate), ...GST_SLABS];
  const selectedClient = clients.find((client) => client._id === values.client);

  function update(event) {
    const { name, value } = event.target;
    setValues((current) => {
      const next = { ...current, [name]: value };
      if (name === 'client') {
        const client = clients.find((item) => item._id === value);
        if (client?.state) next.placeOfSupply = client.state;
      }
      return next;
    });
  }

  function updateItem(index, field, value) {
    setValues((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)),
    }));
  }

  function addItem() {
    setValues((current) => ({
      ...current,
      items: [...current.items, { description: '', quantity: '1', unitPrice: '', hsn: '' }],
    }));
  }

  function removeItem(index) {
    setValues((current) => ({
      ...current,
      items: current.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  function handleSubmit(event, statusOverride) {
    event?.preventDefault();
    const next = {};
    if (!values.client) next.client = 'Choose a client';
    if (!values.issueDate) next.issueDate = 'Choose an issue date';
    if (!values.dueDate) next.dueDate = 'Choose a due date';
    if (values.issueDate && values.dueDate && values.dueDate < values.issueDate) next.dueDate = 'Due date cannot be earlier than the issue date';
    values.items.forEach((item, index) => {
      if (!item.description.trim()) next[`item-${index}-description`] = 'Add a description';
      if (!(Number(item.quantity) > 0)) next[`item-${index}-quantity`] = 'Quantity must be greater than zero';
      if (item.unitPrice === '' || Number(item.unitPrice) < 0 || Number.isNaN(Number(item.unitPrice))) {
        next[`item-${index}-price`] = 'Enter a price';
      }
    });
    setErrors(next);
    if (Object.keys(next).length) return;
    onSubmit({ ...values, status: statusOverride || values.status });
  }

  return (
    <form onSubmit={(event) => handleSubmit(event)} className="space-y-6" noValidate>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
      <div className="space-y-6">
        <div className="rounded-xl border border-line bg-white p-5 shadow-card">
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Client" name="client" required value={values.client} onChange={update} error={errors.client}>
              <option value="">Select a client</option>
              {clients.map((client) => (
                <option key={client._id} value={client._id}>{client.company || client.name}</option>
              ))}
            </Select>
            <div className="flex items-end">
              <Link to="/app/clients" className="text-sm font-medium text-accent">Manage clients</Link>
            </div>
            <Select label="Document" name="documentType" value={values.documentType || 'tax_invoice'} onChange={update}>
              {DOCUMENT_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
            </Select>
            <Select label="Place of supply" name="placeOfSupply" value={values.placeOfSupply || ''} onChange={update}>
              <option value="">Same as your state</option>
              {INDIAN_STATES.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
            </Select>
            <Input label="Issue date" name="issueDate" type="date" required value={values.issueDate} onChange={update} error={errors.issueDate} />
            <Input label="Due date" name="dueDate" type="date" required value={values.dueDate} onChange={update} error={errors.dueDate} />
            {invoiceNumber ? (
              <Select label="Status" name="status" value={values.status} onChange={update}>
                {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
              </Select>
            ) : null}
          </div>
          {clients.length === 0 ? <p className="mt-3 text-sm text-muted">Add a client before this invoice can be saved.</p> : null}
        </div>

        <div className="rounded-xl border border-line bg-white p-5 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-navy-900">Line items</h2>
            <Button variant="secondary" size="sm" onClick={addItem}><Plus className="h-4 w-4" /> Add item</Button>
          </div>
          <div className="hidden grid-cols-[minmax(0,1fr)_6.5rem_5.5rem_7rem_6rem_2.5rem] gap-2 px-1 text-xs font-medium uppercase tracking-wide text-muted md:grid">
            <span>Description</span><span>HSN/SAC</span><span>Qty</span><span>Price</span><span className="text-right">Amount</span><span />
          </div>
          <div className="mt-2 space-y-3">
            {values.items.map((item, index) => {
              const amount = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
              return (
                <div key={index} className="grid gap-2 rounded-lg border border-line p-3 md:grid-cols-[minmax(0,1fr)_6.5rem_5.5rem_7rem_6rem_2.5rem] md:items-start md:border-0 md:p-0">
                  <Input aria-label={`Description ${index + 1}`} label="Description" labelClassName="md:sr-only" value={item.description} onChange={(event) => updateItem(index, 'description', event.target.value)} error={errors[`item-${index}-description`]} />
                  <Input aria-label={`HSN or SAC ${index + 1}`} label="HSN/SAC" labelClassName="md:sr-only" inputMode="numeric" value={item.hsn || ''} onChange={(event) => updateItem(index, 'hsn', event.target.value)} />
                  <Input aria-label={`Quantity ${index + 1}`} label="Qty" labelClassName="md:sr-only" inputMode="decimal" value={item.quantity} onChange={(event) => updateItem(index, 'quantity', event.target.value)} error={errors[`item-${index}-quantity`]} />
                  <Input aria-label={`Price ${index + 1}`} label="Price" labelClassName="md:sr-only" inputMode="decimal" value={item.unitPrice} onChange={(event) => updateItem(index, 'unitPrice', event.target.value)} error={errors[`item-${index}-price`]} />
                  <p className="pt-8 text-sm font-medium text-navy-900 md:pt-2 md:text-right">{money(amount)}</p>
                  <button type="button" className="mt-8 inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted hover:bg-mist disabled:opacity-40 md:mt-0" aria-label={`Remove item ${index + 1}`} disabled={values.items.length === 1} onClick={() => removeItem(index)}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-line bg-white p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="GST slab (%)" name="taxRate" value={String(values.taxRate)} onChange={update}>
              {gstOptions.map((rate) => <option key={rate} value={String(rate)}>{rate}%</option>)}
            </Select>
            <div>
              <Input label="Discount" name="discount" inputMode="decimal" value={values.discount} onChange={update} />
            </div>
            <Select label="Discount type" name="discountType" value={values.discountType} onChange={update}>
              <option value="percent">Percent of subtotal</option>
              <option value="fixed">Fixed amount</option>
            </Select>
          </div>
          <p className="mt-3 text-xs text-muted">{supplyLabel(supplyType)}</p>
          <Textarea className="mt-4" label="Notes" name="notes" value={values.notes} onChange={update} hint="Shown on the invoice and the PDF." />
          <dl className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
            <Row label="Subtotal" value={money(totals.subtotal)} />
            <Row label="Discount" value={money(totals.discountAmount)} />
            {totals.igstAmount > 0 ? <Row label={`IGST (${totals.igstRate}%)`} value={money(totals.igstAmount)} /> : null}
            {totals.supplyType !== 'inter' && totals.taxAmount > 0 ? (
              <>
                <Row label={`CGST (${totals.cgstRate}%)`} value={money(totals.cgstAmount)} />
                <Row label={`SGST (${totals.sgstRate}%)`} value={money(totals.sgstAmount)} />
              </>
            ) : null}
            {totals.taxAmount === 0 ? <Row label="GST" value={money(0)} /> : null}
            <Row label="Total" value={money(totals.grandTotal)} strong />
          </dl>
        </div>
      </div>

      <aside className="lg:sticky lg:top-20">
        <p className="mb-3 text-sm font-semibold text-ink">Invoice preview</p>
        <InvoiceDraftPreview
          values={values}
          totals={totals}
          client={selectedClient}
          business={business}
          invoiceNumber={invoiceNumber}
        />
      </aside>
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {!invoiceNumber ? (
          <Button variant="ghost" loading={submitting} onClick={(event) => handleSubmit(event, 'sent')}>Save and send</Button>
        ) : null}
        {!invoiceNumber ? (
          <Button variant="secondary" loading={submitting} onClick={(event) => handleSubmit(event, 'draft')}>Save draft</Button>
        ) : null}
        <Button type="submit" loading={submitting}>{invoiceNumber ? 'Save changes' : 'Create invoice'}</Button>
      </div>
    </form>
  );
}

function Row({ label, value, strong }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className={strong ? 'font-semibold text-navy-900' : 'text-ink'}>{value}</dd>
    </div>
  );
}
