import { Link, useNavigate } from 'react-router-dom';
import { MoreHorizontal, Users } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Menu, MenuItem } from '../ui/Menu';
import { EmptyState } from '../ui/EmptyState';
import { useMoney } from '../../hooks/useMoney';

export function ClientTable({ clients, sort, order, onSort, onEdit, onDelete, onCreate, filtered }) {
  const money = useMoney();
  const navigate = useNavigate();
  if (!clients.length) {
    return (
      <EmptyState
        icon={Users}
        ledger={!filtered}
        title={filtered ? 'No clients found' : 'No clients yet'}
        description={filtered ? 'Try a different search or filter.' : 'Add your first client to start creating invoices.'}
        action={!filtered && onCreate ? <button type="button" className="inline-flex h-10 items-center rounded-lg bg-accent px-3.5 text-sm font-medium text-white" onClick={onCreate}>Add client</button> : null}
      />
    );
  }

  return (
    <>
      <div className="hidden md:block">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Clients</caption>
          <thead className="border-b border-line bg-sand/60 text-xs font-medium text-muted">
            <tr>
              <th className="px-4 py-3 font-medium" aria-sort={aria(sort, order, 'name')}><Sort label="Client" field="name" sort={sort} order={order} onSort={onSort} /></th>
              <th className="px-4 py-3 font-medium" aria-sort={aria(sort, order, 'email')}><Sort label="Email" field="email" sort={sort} order={order} onSort={onSort} /></th>
              <th className="hidden px-4 py-3 font-medium lg:table-cell" aria-sort={aria(sort, order, 'company')}><Sort label="Company" field="company" sort={sort} order={order} onSort={onSort} /></th>
              <th className="hidden px-4 py-3 font-medium xl:table-cell">GSTIN</th>
              <th className="px-4 py-3 font-medium" aria-sort={aria(sort, order, 'status')}><Sort label="Status" field="status" sort={sort} order={order} onSort={onSort} /></th>
              <th className="px-4 py-3 text-right font-medium" aria-sort={aria(sort, order, 'outstanding')}><Sort label="Outstanding" field="outstanding" sort={sort} order={order} onSort={onSort} align="right" /></th>
              <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client._id} className="cursor-pointer border-b border-line last:border-0 hover:bg-sand/70" onClick={() => navigate(`/app/clients/${client._id}`)}>
                <td className="px-4 py-4">
                  <Link to={`/app/clients/${client._id}`} className="font-medium text-ink hover:text-accent">{client.company || client.name}</Link>
                  <p className="text-xs text-muted">{client.company ? client.name : client.email}</p>
                </td>
                <td className="max-w-[14rem] truncate px-4 py-4 text-muted">{client.email}</td>
                <td className="hidden px-4 py-4 lg:table-cell">{client.company || '—'}</td>
                <td className="hidden px-4 py-4 text-muted xl:table-cell">{client.gstin || '—'}</td>
                <td className="px-4 py-4"><Badge tone={client.status} /></td>
                <td className="num px-4 py-4 text-right font-medium">{money(client.outstanding || 0)}</td>
                <td className="px-4 py-3 text-right" onClick={(event) => event.stopPropagation()}>
                  <Actions client={client} onEdit={onEdit} onDelete={onDelete} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="divide-y divide-line md:hidden">
        {clients.map((client) => (
          <li key={client._id} className="px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link to={`/app/clients/${client._id}`} className="font-medium text-navy-900">{client.name}</Link>
                <p className="truncate text-sm text-muted">{client.company || client.email}</p>
                <p className="mt-1 text-sm">{money(client.outstanding || 0)} outstanding</p>
              </div>
              <Badge tone={client.status} />
            </div>
            <div className="mt-3 flex justify-end">
              <Actions client={client} onEdit={onEdit} onDelete={onDelete} />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

function Actions({ client, onEdit, onDelete }) {
  return (
    <Menu label={<><MoreHorizontal className="h-4 w-4" /><span className="sr-only">Actions for {client.name}</span></>} buttonClassName="p-1 text-muted hover:bg-mist">
      <MenuItem to={`/app/clients/${client._id}`}>View</MenuItem>
      <MenuItem onClick={() => onEdit(client)}>Edit</MenuItem>
      <MenuItem className="text-red-700" onClick={() => onDelete(client)}>Delete</MenuItem>
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

function aria(sort, order, field) {
  if (sort !== field) return 'none';
  return order === 'asc' ? 'ascending' : 'descending';
}
