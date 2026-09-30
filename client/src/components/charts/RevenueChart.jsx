import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { compactMoney, formatMoney } from '../../utils/format';

export function RevenueChart({ data, currency = 'INR' }) {
  return (
    <div className="h-72 min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#E5E5E0" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={(value) => compactMoney(value, currency)} tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} width={56} />
          <Tooltip
            formatter={(value) => [formatMoney(value, currency), 'Revenue']}
            contentStyle={{ border: '1px solid #E5E5E0', borderRadius: 8, fontSize: 13, boxShadow: 'none' }}
          />
          <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#4338CA" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#4338CA' }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
