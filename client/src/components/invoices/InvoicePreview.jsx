import { formatDate } from '../../utils/format';
import { useMoney } from '../../hooks/useMoney';
import { amountInWords, documentLabel, stateName } from '../../content/india';
import { Badge } from '../ui/Badge';

export function InvoicePreview({ invoice, business }) {
  const money = useMoney();
  const snapshot = invoice.clientSnapshot || {};
  const billName = snapshot.company || snapshot.name;

  return (
    <article className="mx-auto w-full max-w-3xl overflow-hidden rounded-xl border border-line bg-white">
      <div className="h-1 bg-accent" aria-hidden="true" />
      <div className="flex">
        <div className="min-w-0 flex-1 p-5 sm:p-8">
          <header className="flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:justify-between">
            <div className="flex gap-3">
              {business?.logo ? <img src={business.logo} alt="" className="h-12 w-12 rounded-md object-cover" /> : null}
              <div>
                <p className="text-lg font-semibold text-navy-900">{business?.businessName || business?.name}</p>
                <p className="mt-1 whitespace-pre-line text-xs leading-5 text-muted">{business?.address}</p>
              </div>
            </div>
            <div className="sm:text-right">
              <p className="text-xs tracking-[0.16em] text-muted">{documentLabel(invoice.documentType).toUpperCase()}</p>
              <p className="text-xl font-semibold text-navy-900">{invoice.invoiceNumber}</p>
              <div className="mt-2"><Badge tone={invoice.status} /></div>
            </div>
          </header>

          <div className="grid gap-6 py-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium tracking-wide text-muted">FROM</p>
              <p className="mt-1 text-sm font-medium text-navy-900">{business?.businessName || business?.name}</p>
              <p className="text-sm text-muted">{business?.email}</p>
              <p className="text-sm text-muted">{business?.phone}</p>
              {business?.gstin || business?.taxNumber ? <p className="text-sm text-muted">GSTIN {business.gstin || business.taxNumber}</p> : null}
              {business?.pan ? <p className="text-sm text-muted">PAN {business.pan}</p> : null}
              {business?.state ? <p className="text-sm text-muted">{stateName(business.state)}</p> : null}
            </div>
            <div>
              <p className="text-xs font-medium tracking-wide text-muted">BILL TO</p>
              <p className="mt-1 text-sm font-medium text-navy-900">{billName}</p>
              {snapshot.company && snapshot.name ? <p className="text-sm text-muted">{snapshot.name}</p> : null}
              <p className="text-sm text-muted">{snapshot.email}</p>
              <p className="whitespace-pre-line text-sm text-muted">{snapshot.address}</p>
              {snapshot.gstin ? <p className="text-sm text-muted">GSTIN {snapshot.gstin}</p> : null}
              {snapshot.state ? <p className="text-sm text-muted">{stateName(snapshot.state)}</p> : null}
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-4 border-y border-line py-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs text-muted">Issue date</dt>
              <dd className="font-medium">{formatDate(invoice.issueDate)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Due date</dt>
              <dd className="font-medium">{formatDate(invoice.dueDate)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Place of supply</dt>
              <dd className="font-medium">{stateName(invoice.placeOfSupply) || business?.currency || 'INR'}</dd>
            </div>
          </dl>

          <div className="mt-4 overflow-hidden">
            <table className="w-full text-sm">
              <caption className="sr-only">Invoice line items</caption>
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted">
                  <th className="py-2 font-medium">Description</th>
                  <th className="hidden py-2 font-medium sm:table-cell">HSN/SAC</th>
                  <th className="py-2 text-right font-medium">Qty</th>
                  <th className="hidden py-2 text-right font-medium sm:table-cell">Rate</th>
                  <th className="py-2 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => (
                  <tr key={`${item.description}-${index}`} className="border-t border-line">
                    <td className="py-3 pr-3">{item.description}</td>
                    <td className="hidden py-3 sm:table-cell">{item.hsn || '—'}</td>
                    <td className="py-3 text-right">{item.quantity}</td>
                    <td className="hidden py-3 text-right sm:table-cell">{money(item.unitPrice)}</td>
                    <td className="py-3 text-right font-medium">{money(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <dl className="ml-auto mt-4 w-full max-w-xs space-y-2 text-sm">
            <Line label="Subtotal" value={money(invoice.subtotal)} />
            <Line label="Discount" value={money(invoice.discountAmount)} />
            {invoice.igstAmount > 0 ? <Line label={`IGST (${invoice.igstRate}%)`} value={money(invoice.igstAmount)} /> : null}
            {invoice.supplyType !== 'inter' && invoice.taxAmount > 0 ? (
              <>
                <Line label={`CGST (${invoice.cgstRate}%)`} value={money(invoice.cgstAmount)} />
                <Line label={`SGST (${invoice.sgstRate}%)`} value={money(invoice.sgstAmount)} />
              </>
            ) : null}
            {!invoice.taxAmount ? <Line label={`GST (${invoice.taxRate || 0}%)`} value={money(0)} /> : null}
            <Line label="Total" value={money(invoice.grandTotal)} strong />
            <Line label="Outstanding" value={money(invoice.outstanding)} strong />
          </dl>
          {(business?.currency || 'INR') === 'INR' ? (
            <p className="mt-4 text-sm text-muted">{amountInWords(invoice.grandTotal)}</p>
          ) : null}
          {invoice.upiId || business?.upiId ? (
            <p className="mt-3 text-sm text-ink"><span className="text-muted">UPI </span>{invoice.upiId || business.upiId}</p>
          ) : null}

          {invoice.notes ? (
            <div className="mt-6 border-t border-line pt-4">
              <p className="text-xs font-medium tracking-wide text-muted">NOTES</p>
              <p className="mt-2 whitespace-pre-line text-sm text-ink">{invoice.notes}</p>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function Line({ label, value, strong }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className={strong ? 'font-semibold text-navy-900' : ''}>{value}</dd>
    </div>
  );
}
