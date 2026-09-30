import { LogoMark } from '../layout/Logo';
import { documentLabel } from '../../content/india';
import { useMoney } from '../../hooks/useMoney';

export function InvoiceDraftPreview({ values, totals, client, business, invoiceNumber }) {
  const money = useMoney();
  const billName = client?.company || client?.name || 'Client';

  return (
    <article className="overflow-hidden rounded-xl border border-line bg-white">
      <div className="h-1 bg-accent" aria-hidden="true" />
      <div className="ledger-lines p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3 border-b border-line pb-4">
          <div className="flex items-center gap-2">
            <LogoMark className="h-7 w-7" />
            <div>
              <p className="text-[11px] font-semibold tracking-[0.16em] text-ink">LEKHA</p>
              <p className="text-xs text-muted">{business?.businessName || business?.name || 'Your business'}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-medium tracking-[0.14em] text-muted">{documentLabel(values.documentType).toUpperCase()}</p>
            <p className="text-sm font-semibold text-ink">{invoiceNumber || 'Draft'}</p>
          </div>
        </div>

        <div className="mt-4 text-sm">
          <p className="text-[11px] font-medium tracking-wide text-faint">BILL TO</p>
          <p className="mt-1 font-medium text-ink">{billName}</p>
          {client?.gstin ? <p className="text-xs text-muted">GSTIN {client.gstin}</p> : null}
        </div>

        <ul className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
          {values.items.map((item, index) => {
            const amount = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
            return (
              <li key={index} className="flex items-start justify-between gap-3">
                <span className="min-w-0">
                  <span className="block truncate text-ink">{item.description || 'Line item'}</span>
                  <span className="text-xs text-muted">{item.quantity || 0} × {money(item.unitPrice || 0)}</span>
                </span>
                <span className="num text-ink">{money(amount)}</span>
              </li>
            );
          })}
        </ul>

        <dl className="mt-4 space-y-1.5 border-t border-line pt-4 text-sm">
          <Row label="Subtotal" value={money(totals.subtotal)} />
          {totals.discountAmount > 0 ? <Row label="Discount" value={money(totals.discountAmount)} /> : null}
          {totals.igstAmount > 0 ? <Row label={`IGST ${totals.igstRate}%`} value={money(totals.igstAmount)} /> : null}
          {totals.supplyType !== 'inter' && totals.taxAmount > 0 ? (
            <>
              <Row label={`CGST ${totals.cgstRate}%`} value={money(totals.cgstAmount)} />
              <Row label={`SGST ${totals.sgstRate}%`} value={money(totals.sgstAmount)} />
            </>
          ) : null}
          <div className="flex items-center justify-between border-t border-line pt-2">
            <dt className="font-medium text-ink">Total</dt>
            <dd className="num text-lg font-semibold text-ink">{money(totals.grandTotal)}</dd>
          </div>
        </dl>
      </div>
    </article>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 text-muted">
      <dt>{label}</dt>
      <dd className="num text-ink">{value}</dd>
    </div>
  );
}
