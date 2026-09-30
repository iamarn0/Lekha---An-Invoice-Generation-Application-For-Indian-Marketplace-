import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../../services/endpoints';
import { useAuth } from '../../context/AuthContext';
import { useMoney } from '../../hooks/useMoney';
import { usePageMeta } from '../../hooks/usePageMeta';
import { formatChange } from '../../utils/format';
import { getErrorMessage } from '../../utils/errors';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/EmptyState';
import { AnalyticsRevenueChart, ClientGrowthChart, InvoiceTrendChart } from '../../components/charts/TrendCharts';

export function AnalyticsPage() {
  usePageMeta('Analytics', 'Monthly revenue, paid invoices, outstanding balances, and client growth.');
  const [months, setMonths] = useState(6);
  const { user } = useAuth();
  const money = useMoney();
  const query = useQuery({
    queryKey: ['analytics', months],
    queryFn: () => analyticsApi.overview(months).then((response) => response.data.data),
  });

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-ink">Analytics</h1>
          <p className="mt-1.5 text-sm text-muted">Revenue, collections, and client movement over the last {months} months.</p>
        </div>
        <div className="flex gap-2" role="group" aria-label="Date range">
          <Button variant={months === 6 ? 'primary' : 'secondary'} onClick={() => setMonths(6)}>6 months</Button>
          <Button variant={months === 12 ? 'primary' : 'secondary'} onClick={() => setMonths(12)}>12 months</Button>
        </div>
      </div>

      {query.isLoading ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-28" />)}
        </div>
      ) : null}
      {query.isError ? <div className="mt-5"><ErrorState message={getErrorMessage(query.error)} onRetry={() => query.refetch()} /></div> : null}

      {query.data ? (
        <>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="Revenue" value={money(rangeRevenue(query.data))} hint={formatChange(query.data.revenueChange) || `Paid in ${months} months`} />
            <Metric label="Outstanding" value={money(query.data.outstandingAmount)} hint={`${query.data.outstandingCount} open invoices`} />
            <Metric label="Paid invoices" value={query.data.paidInvoices} hint={`In the last ${months} months`} />
            <Metric label="Average invoice" value={money(averageInvoice(query.data))} hint="Paid in this period" />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title="Revenue trends" description="Paid invoice totals" />
              <div className="p-4"><AnalyticsRevenueChart data={query.data.revenueTrends} currency={user?.currency} /></div>
            </Card>
            <Card>
              <CardHeader title="Invoice trends" description="Issued compared with paid" />
              <div className="p-4"><InvoiceTrendChart data={query.data.invoiceTrends} /></div>
            </Card>
          </div>
          <Card className="mt-4">
            <CardHeader title="Client growth" description="New clients added each month" />
            <div className="p-4"><ClientGrowthChart data={query.data.clientGrowth} /></div>
          </Card>
        </>
      ) : null}
    </div>
  );
}

function rangeRevenue(data) {
  return (data.revenueTrends || []).reduce((sum, item) => sum + (Number(item.revenue) || 0), 0);
}

function averageInvoice(data) {
  const paid = Number(data.paidInvoices) || 0;
  if (!paid) return 0;
  return rangeRevenue(data) / paid;
}

function Metric({ label, value, hint }) {
  return (
    <div className="rounded-xl border border-line bg-white p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="num mt-3 text-[28px] font-semibold tracking-tight text-ink">{value}</p>
      <p className={`mt-1 text-xs ${String(hint).startsWith('↑') ? 'text-success' : String(hint).startsWith('↓') ? 'text-danger' : 'text-muted'}`}>{hint}</p>
    </div>
  );
}
