import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { BarChart3, FilePlus2, Search, UserPlus } from 'lucide-react';
import { invoiceApi, searchApi } from '../../services/endpoints';
import { useDebounce } from '../../hooks/useDebounce';
import { formatMoney, invoiceClient } from '../../utils/format';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';

const actions = [
  { id: 'new-invoice', label: 'Create invoice', hint: 'Action', to: '/app/invoices/new', icon: FilePlus2 },
  { id: 'add-client', label: 'Add client', hint: 'Action', to: '/app/clients?new=1', icon: UserPlus },
  { id: 'analytics', label: 'View analytics', hint: 'Navigate', to: '/app/analytics', icon: BarChart3 },
  { id: 'invoices', label: 'Invoices', hint: 'Navigate', to: '/app/invoices', icon: FilePlus2 },
  { id: 'clients', label: 'Clients', hint: 'Navigate', to: '/app/clients', icon: UserPlus },
];

export function CommandMenu({ open, onClose }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const reduce = useReducedMotion();
  const [term, setTerm] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const debounced = useDebounce(term, 200);

  const recent = useQuery({
    queryKey: ['invoices', 'command-recent'],
    queryFn: () => invoiceApi.list({ limit: 4, sort: 'issueDate', order: 'desc' }).then((response) => response.data.data.items),
    enabled: open,
  });

  const results = useQuery({
    queryKey: ['search', debounced],
    queryFn: () => searchApi.query(debounced).then((response) => response.data.data),
    enabled: open && debounced.trim().length >= 2,
  });

  const items = useMemo(() => {
    const query = term.trim().toLowerCase();
    const matchedActions = actions.filter((action) => !query || action.label.toLowerCase().includes(query));
    if (query.length < 2) {
      const recents = (recent.data || []).map((invoice) => ({
        id: invoice._id,
        label: invoice.invoiceNumber,
        hint: invoiceClient(invoice),
        to: `/app/invoices/${invoice._id}`,
        group: 'Recent',
      }));
      return [
        ...recents.map((item) => ({ ...item })),
        ...matchedActions.map((action) => ({ ...action, group: 'Actions' })),
      ];
    }
    const invoices = (results.data?.invoices || []).map((invoice) => ({
      id: invoice._id,
      label: invoice.invoiceNumber,
      hint: `${invoiceClient(invoice)} · ${formatMoney(invoice.grandTotal, user?.currency)}`,
      to: `/app/invoices/${invoice._id}`,
      group: 'Invoices',
    }));
    const clients = (results.data?.clients || []).map((client) => ({
      id: client._id,
      label: client.company || client.name,
      hint: client.email,
      to: `/app/clients/${client._id}`,
      group: 'Clients',
    }));
    return [
      ...invoices,
      ...clients,
      ...matchedActions.map((action) => ({ ...action, group: 'Actions' })),
    ];
  }, [term, recent.data, results.data, user?.currency]);

  useEffect(() => {
    if (!open) return undefined;
    setTerm('');
    setActive(0);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 20);
    function onKey(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    }
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  useEffect(() => {
    setActive(0);
  }, [term]);

  function go(item) {
    if (!item) return;
    onClose();
    navigate(item.to);
  }

  function onInputKey(event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((current) => Math.min(current + 1, Math.max(items.length - 1, 0)));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((current) => Math.max(current - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      go(items[active]);
    }
  }

  const groups = [];
  items.forEach((item) => {
    const last = groups[groups.length - 1];
    if (!last || last.name !== item.group) groups.push({ name: item.group, items: [item] });
    else last.items.push(item);
  });

  let index = -1;

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh]">
          <motion.button
            type="button"
            className="absolute inset-0 bg-ink/40"
            aria-label="Close search"
            onClick={onClose}
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Search LEKHA"
            className="relative z-10 w-full max-w-xl overflow-hidden rounded-xl border border-line bg-white shadow-lift"
            initial={reduce ? false : { opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.16 }}
          >
            <div className="flex items-center gap-3 border-b border-line px-4">
              <Search className="h-4 w-4 text-muted" aria-hidden="true" />
              <label htmlFor="command-search" className="sr-only">Search LEKHA</label>
              <input
                id="command-search"
                ref={inputRef}
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                onKeyDown={onInputKey}
                placeholder="Search invoices, clients, and actions"
                className="h-12 w-full bg-transparent text-sm text-ink outline-none placeholder:text-faint"
              />
            </div>
            <div className="max-h-80 overflow-y-auto p-2" role="listbox">
              {results.isFetching && term.trim().length >= 2 ? <p className="px-3 py-2 text-sm text-muted">Searching…</p> : null}
              {!items.length ? <p className="px-3 py-6 text-center text-sm text-muted">No matches.</p> : null}
              {groups.map((group) => (
                <div key={group.name} className="mb-1">
                  <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-faint">{group.name}</p>
                  {group.items.map((item) => {
                    index += 1;
                    const current = index;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        role="option"
                        aria-selected={current === active}
                        className={cn('flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm', current === active ? 'bg-accent-soft text-ink' : 'hover:bg-sand')}
                        onMouseEnter={() => setActive(current)}
                        onClick={() => go(item)}
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          {Icon ? <Icon className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" /> : null}
                          <span className="truncate font-medium">{item.label}</span>
                        </span>
                        <span className="truncate text-xs text-muted">{item.hint}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
