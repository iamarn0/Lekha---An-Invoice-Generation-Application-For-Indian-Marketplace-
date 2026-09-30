import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { compactMoney, formatMoney } from '../../utils/format';

const axis = { fontSize: 12, fill: '#6B7280' };
const grid = '#E5E5E0';
const tip = { border: '1px solid #E5E5E0', borderRadius: 8, fontSize: 13, boxShadow: 'none' };

export function InvoiceTrendChart({ data }) {
  return (
    <div className="h-72 min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={grid} vertical={false} />
          <XAxis dataKey="label" tick={axis} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={axis} axisLine={false} tickLine={false} width={32} />
          <Tooltip contentStyle={tip} />
          <Legend />
          <Bar dataKey="issued" name="Issued" fill="#D6D3F5" radius={[4, 4, 0, 0]} />
          <Bar dataKey="paid" name="Paid" fill="#4338CA" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ClientGrowthChart({ data }) {
  return (
    <div className="h-72 min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={grid} vertical={false} />
          <XAxis dataKey="label" tick={axis} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={axis} axisLine={false} tickLine={false} width={32} />
          <Tooltip contentStyle={tip} />
          <Bar dataKey="clients" name="New clients" fill="#4338CA" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AnalyticsRevenueChart({ data, currency }) {
  return (
    <div className="h-72 min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={grid} vertical={false} />
          <XAxis dataKey="label" tick={axis} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={(value) => compactMoney(value, currency || 'INR')} tick={axis} axisLine={false} tickLine={false} width={56} />
          <Tooltip formatter={(value) => [formatMoney(value, currency), 'Revenue']} contentStyle={tip} />
          <Bar dataKey="revenue" name="Revenue" fill="#4338CA" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
