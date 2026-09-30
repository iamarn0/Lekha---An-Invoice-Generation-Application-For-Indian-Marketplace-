import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Check, Circle, FileText, Plus, Wallet } from 'lucide-react';
import { analyticsApi } from '../../services/endpoints';
import { useAuth } from '../../context/AuthContext';
import { useMoney } from '../../hooks/useMoney';
import { usePageMeta } from '../../hooks/usePageMeta';
import { formatChange, formatDate, greeting, invoiceClient } from '../../utils/format';
import { getErrorMessage } from '../../utils/errors';
import { buttonClasses } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../../components/ui/EmptyState';
import { ActivityFeed } from '../../components/dashboard/ActivityFeed';
import { RevenueChart } from '../../components/charts/RevenueChart';
import { StatusChart } from '../../components/charts/StatusChart';

export function DashboardPage() {
  usePageMeta('Overview', 'Revenue, outstanding tax invoices, and recent activity for your LEKHA workspace.');
  const { user } = useAuth();
  const money = useMoney();
  const query = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => analyticsApi.dashboard().then((response) => response.data.data),
  });

  const today = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());

  if (query.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-72" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-32" />)}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  if (query.isError) return <ErrorState message={getErrorMessage(query.error)} onRetry={() => query.refetch()} />;

  const { stats, revenueByMonth, statusDistribution, recentPayments, outstandingInvoices, activities } = query.data;
  const revenueEmpty = revenueByMonth.every((item) => item.revenue === 0);
  const noBusiness = !stats.paidInvoices && !stats.outstandingCount && !stats.activeClients;

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-ink sm:text-[30px]">{greeting(user?.name)}</h1>
          <p className="mt-1 text-sm text-muted">{today}</p>
        </div>
        <Link to="/app/invoices/new" className={buttonClasses()}><Plus className="h-4 w-4" /> New invoice</Link>
      </div>

      <SetupCard user={user} />

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Revenue"
          value={money(stats.monthlyRevenue)}
          hint={formatChange(stats.revenueChange) || (stats.monthlyRevenue ? 'This month' : 'This month')}
          empty={stats.totalRevenue === 0 ? 'No revenue recorded yet.' : null}
        />
        <Metric
          label="Outstanding"
          value={money(stats.outstandingAmount)}
          hint={stats.outstandingCount === 1 ? '1 open invoice' : `${stats.outstandingCount} open invoices`}
        />
        <Metric label="Paid invoices" value={stats.paidInvoices} hint="All time" />
        <Metric label="Clients" value={stats.activeClients} hint="Active" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Revenue" description="Paid invoices" />
          <div className="p-4">
            {revenueEmpty ? (
              <EmptyState
                ledger
                icon={Wallet}
                title="No revenue recorded yet"
                description="Create your first invoice to start tracking your business revenue."
                action={<Link to="/app/invoices/new" className={buttonClasses()}>Create invoice</Link>}
              />
            ) : <RevenueChart data={revenueByMonth} currency={user?.currency} />}
          </div>
        </Card>
        <Card>
          <CardHeader title="Invoice status" />
          <div className="p-4">
            <StatusChart data={statusDistribution} />
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Outstanding invoices" action={<Link to="/app/invoices" className="text-sm font-medium text-accent">View invoices</Link>} />
          {outstandingInvoices.length === 0 ? (
            <EmptyState
              icon={FileText}
              title={noBusiness ? 'No invoices yet' : 'Nothing outstanding'}
              description={noBusiness ? 'Create your first invoice and start tracking payments with LEKHA.' : 'Open invoices will appear here as soon as one is sent.'}
              action={noBusiness ? <Link to="/app/invoices/new" className={buttonClasses()}>Create invoice</Link> : null}
            />
          ) : (
            <ul className="divide-y divide-line">
              {outstandingInvoices.map((invoice) => (
                <li key={invoice._id}>
                  <Link to={`/app/invoices/${invoice._id}`} className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-sand">
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-ink">{invoice.invoiceNumber}</span>
                      <span className="block truncate text-xs text-muted">{invoiceClient(invoice)} · Due {formatDate(invoice.dueDate)}</span>
                    </span>
                    <span className="text-right">
                      <span className="num block text-sm font-semibold">{money(invoice.outstanding)}</span>
                      <Badge tone={invoice.status} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <CardHeader title="Activity" action={<Link to="/app/activity" className="text-sm font-medium text-accent">See all</Link>} />
          <ActivityFeed items={activities} />
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader title="Recent payments" />
        {recentPayments.length === 0 ? (
          <p className="px-5 py-10 text-sm text-muted">Paid invoices will be listed here.</p>
        ) : (
          <ul className="divide-y divide-line">
            {recentPayments.map((invoice) => (
              <li key={invoice._id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                <Link to={`/app/invoices/${invoice._id}`} className="min-w-0">
                  <span className="block text-sm font-medium text-ink">{invoice.invoiceNumber} paid</span>
                  <span className="block truncate text-xs text-muted">{invoiceClient(invoice)} · {formatDate(invoice.paidAt)}</span>
                </Link>
                <span className="num text-sm font-semibold">{money(invoice.grandTotal)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function SetupCard({ user }) {
  const steps = [
    { label: 'Business details', done: Boolean(user?.businessName && user?.address && user?.state) },
    { label: 'Tax information', done: Boolean(user?.gstin || user?.pan) },
    { label: 'Payment details', done: Boolean(user?.upiId) },
  ];
  const done = steps.filter((step) => step.done).length;
  if (done === steps.length) return null;

  return (
    <div className="mt-6 rounded-xl border border-line bg-white px-5 py-5 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[15px] font-semibold text-ink">Complete your business setup</p>
          <p className="mt-1 text-sm text-muted">Add your business details so invoices are ready to send.</p>
          <p className="mt-3 text-xs font-medium text-muted">{done} of {steps.length} complete</p>
        </div>
        <Link to="/app/settings" className="text-sm font-medium text-accent">Open settings →</Link>
      </div>
      <ul className="mt-4 grid gap-2 sm:grid-cols-3">
        {steps.map((step) => (
          <li key={step.label} className="flex items-center gap-2 text-sm text-ink">
            {step.done ? <Check className="h-4 w-4 text-success" aria-hidden="true" /> : <Circle className="h-4 w-4 text-faint" aria-hidden="true" />}
            {step.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Metric({ label, value, hint, empty }) {
  return (
    <div className="rounded-xl border border-line bg-white p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="num mt-3 text-[28px] font-semibold tracking-tight text-ink">{value}</p>
      {empty ? <p className="mt-1 text-xs text-muted">{empty}</p> : null}
      <p className={`mt-1 text-xs ${hint?.startsWith('↑') ? 'text-success' : hint?.startsWith('↓') ? 'text-danger' : 'text-muted'}`}>{hint}</p>
    </div>
  );
}
