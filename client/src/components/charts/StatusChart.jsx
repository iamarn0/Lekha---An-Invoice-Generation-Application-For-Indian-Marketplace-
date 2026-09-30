import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

const colors = {
  draft: '#9CA3AF',
  sent: '#4338CA',
  paid: '#15803D',
  overdue: '#DC2626',
  cancelled: '#D1D5DB',
};

export function StatusChart({ data }) {
  const slices = (data || []).filter((item) => item.count > 0);
  const total = (data || []).reduce((sum, item) => sum + item.count, 0);

  if (!total) {
    return <p className="px-2 py-16 text-center text-sm text-muted">Status appears after the first invoice.</p>;
  }

  return (
    <div className="grid items-center gap-4 sm:grid-cols-[160px_1fr]">
      <div className="h-40 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={slices} dataKey="count" nameKey="status" innerRadius={46} outerRadius={64} paddingAngle={2} stroke="none">
              {slices.map((slice) => <Cell key={slice.status} fill={colors[slice.status]} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="space-y-2 text-sm">
        {data.map((item) => (
          <li key={item.status} className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 capitalize text-ink">
              <span className="h-2 w-2 rounded-full" style={{ background: colors[item.status] }} />
              {item.status}
            </span>
            <span className="num font-medium text-ink">{item.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
