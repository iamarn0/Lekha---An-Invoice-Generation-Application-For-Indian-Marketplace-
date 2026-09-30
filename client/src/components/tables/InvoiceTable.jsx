import { Link, useNavigate } from 'react-router-dom';
import { MoreHorizontal } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Menu, MenuItem } from '../ui/Menu';
import { EmptyState } from '../ui/EmptyState';
import { FileText } from 'lucide-react';
import { formatDate, invoiceClient } from '../../utils/format';
import { documentLabel } from '../../content/india';
import { useMoney } from '../../hooks/useMoney';

export function InvoiceTable({ invoices, sort, order, onSort, onDelete, filtered }) {
  const money = useMoney();
  const navigate = useNavigate();
  if (!invoices.length) {
    return (
      <EmptyState
        icon={FileText}
        ledger={!filtered}
        title={filtered ? 'No invoices found' : 'No invoices yet'}
        description={filtered ? 'Try a different status, client, or date range.' : 'Create your first invoice and start tracking payments with LEKHA.'}
        action={filtered ? null : <Link to="/app/invoices/new" className="inline-flex h-10 items-center rounded-lg bg-accent px-3.5 text-sm font-medium text-white">Create invoice</Link>}
      />
    );
  }

  return (
    <>
      <div className="hidden md:block">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Invoices</caption>
          <thead className="border-b border-line bg-sand/60 text-xs font-medium text-muted">
            <tr>
              <th className="px-4 py-3 font-medium" aria-sort={ariaSort(sort, order, 'invoiceNumber')}><Sort label="Invoice" field="invoiceNumber" sort={sort} order={order} onSort={onSort} /></th>
              <th className="px-4 py-3 font-medium">Client</th>
              <th className="hidden px-4 py-3 font-medium lg:table-cell" aria-sort={ariaSort(sort, order, 'issueDate')}><Sort label="Issued" field="issueDate" sort={sort} order={order} onSort={onSort} /></th>
              <th className="px-4 py-3 font-medium" aria-sort={ariaSort(sort, order, 'dueDate')}><Sort label="Due" field="dueDate" sort={sort} order={order} onSort={onSort} /></th>
              <th className="px-4 py-3 font-medium" aria-sort={ariaSort(sort, order, 'status')}><Sort label="Status" field="status" sort={sort} order={order} onSort={onSort} /></th>
              <th className="px-4 py-3 text-right font-medium" aria-sort={ariaSort(sort, order, 'grandTotal')}><Sort label="Total" field="grandTotal" sort={sort} order={order} onSort={onSort} align="right" /></th>
              <th className="hidden px-4 py-3 text-right font-medium xl:table-cell">Outstanding</th>
              <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice._id} className="cursor-pointer border-b border-line last:border-0 hover:bg-sand/70" onClick={() => navigate(`/app/invoices/${invoice._id}`)}>
                <td className="px-4 py-4 font-medium text-ink">
                  <Link to={`/app/invoices/${invoice._id}`} className="hover:text-accent">{invoice.invoiceNumber}</Link>
                  {invoice.documentType && invoice.documentType !== 'tax_invoice' ? <p className="text-xs font-normal text-muted">{documentLabel(invoice.documentType)}</p> : null}
                </td>
                <td className="max-w-[12rem] px-4 py-3">
                  <p className="truncate">{invoiceClient(invoice)}</p>
                </td>
                <td className="hidden px-4 py-3 text-muted lg:table-cell">{formatDate(invoice.issueDate)}</td>
                <td className="px-4 py-3 text-muted">{formatDate(invoice.dueDate)}</td>
                <td className="px-4 py-3"><Badge tone={invoice.status} /></td>
                <td className="px-4 py-3 text-right font-medium">{money(invoice.grandTotal)}</td>
                <td className="hidden px-4 py-3 text-right xl:table-cell">{money(invoice.outstanding)}</td>
                <td className="px-4 py-3 text-right" onClick={(event) => event.stopPropagation()}>
                  <RowMenu invoice={invoice} onDelete={onDelete} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="divide-y divide-line md:hidden">
        {invoices.map((invoice) => (
          <li key={invoice._id} className="px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link to={`/app/invoices/${invoice._id}`} className="font-medium text-navy-900">{invoice.invoiceNumber}</Link>
                {invoice.documentType && invoice.documentType !== 'tax_invoice' ? <p className="text-xs text-muted">{documentLabel(invoice.documentType)}</p> : null}
                <p className="truncate text-sm text-muted">{invoiceClient(invoice)}</p>
                <p className="mt-1 text-sm">{money(invoice.grandTotal)}</p>
              </div>
              <Badge tone={invoice.status} />
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-muted">
              <span>Due {formatDate(invoice.dueDate)}</span>
              <RowMenu invoice={invoice} onDelete={onDelete} />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

function RowMenu({ invoice, onDelete }) {
  return (
    <Menu label={<><MoreHorizontal className="h-4 w-4" /><span className="sr-only">Actions for {invoice.invoiceNumber}</span></>} buttonClassName="p-1 text-muted hover:bg-mist">
      <MenuItem to={`/app/invoices/${invoice._id}`}>View</MenuItem>
      <MenuItem to={`/app/invoices/${invoice._id}/edit`}>Edit</MenuItem>
      <MenuItem className="text-red-700" onClick={() => onDelete(invoice)}>Delete</MenuItem>
    </Menu>
  );
}

function Sort({ label, field, sort, order, onSort, align }) {
  const active = sort === field;
  return (
    <button type="button" className={`inline-flex items-center gap-1 ${align === 'right' ? 'ml-auto' : ''}`} onClick={() => onSort(field)}>
      {label}
      <span aria-hidden="true">{active ? (order === 'asc' ? '↑' : '↓') : ''}</span>
    </button>
  );
}

function ariaSort(sort, order, field) {
  if (sort !== field) return 'none';
  return order === 'asc' ? 'ascending' : 'descending';
}
