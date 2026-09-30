import { useState } from 'react';
import { Link } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { activityApi } from '../../services/endpoints';
import { usePageMeta } from '../../hooks/usePageMeta';
import { formatRelative } from '../../utils/format';
import { getErrorMessage } from '../../utils/errors';
import { Card } from '../../components/ui/Card';
import { Pagination } from '../../components/ui/Pagination';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../../components/ui/EmptyState';
import { Bell } from 'lucide-react';

export function ActivityPage() {
  usePageMeta('Activity', 'A history of invoices, clients, and payments in your workspace.');
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ['activity', page],
    queryFn: () => activityApi.list({ page, limit: 12 }).then((response) => response.data.data),
    placeholderData: keepPreviousData,
  });

  return (
    <div>
      <h1 className="text-[28px] font-semibold tracking-tight text-ink">Activity</h1>
      <p className="mt-1.5 text-sm text-muted">A record of what changed in this workspace.</p>
      <Card className="mt-5 overflow-hidden">
        {query.isLoading ? <div className="space-y-3 p-4">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-12" />)}</div> : null}
        {query.isError ? <div className="p-4"><ErrorState message={getErrorMessage(query.error)} onRetry={() => query.refetch()} /></div> : null}
        {query.data && query.data.items.length === 0 ? <EmptyState ledger icon={Bell} title="No activity yet" description="Creating a client or invoice will show up here." /> : null}
        {query.data && query.data.items.length > 0 ? (
          <>
            <ul className="divide-y divide-line">
              {query.data.items.map((item) => (
                <li key={item._id} className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  {item.invoice ? (
                    <Link to={`/app/invoices/${item.invoice}`} className="text-sm font-medium text-navy-900 hover:text-accent">{item.message}</Link>
                  ) : (
                    <p className="text-sm font-medium text-navy-900">{item.message}</p>
                  )}
                  <time className="text-xs text-muted" dateTime={item.createdAt}>{formatRelative(item.createdAt)}</time>
                </li>
              ))}
            </ul>
            <Pagination page={query.data.pagination.page} pages={query.data.pagination.pages} total={query.data.pagination.total} label="events" onPage={setPage} />
          </>
        ) : null}
      </Card>
    </div>
  );
}
