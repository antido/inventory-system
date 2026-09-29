// Chart components built with Recharts, styled to match the app.
// Each chart shows a single series, so it uses one color and needs no legend.
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatMoney, formatMoneyShort, formatNumber, formatShortDate } from '../utils/format';

const SERIES_COLOR = '#2a78d6';
const GRID_COLOR = '#eceae6';
const AXIS_TEXT = { fontSize: 12, fill: '#6b6a66' };

const tooltipStyle = {
  borderRadius: 8,
  border: '1px solid #e4e2dd',
  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
  fontSize: 13,
};

/** Money over time, e.g. daily revenue. */
export function RevenueAreaChart({ data, dataKey }: { data: object[]; dataKey: string }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={SERIES_COLOR} stopOpacity={0.22} />
            <stop offset="100%" stopColor={SERIES_COLOR} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID_COLOR} vertical={false} />
        <XAxis dataKey="date" tickFormatter={formatShortDate} tick={AXIS_TEXT} axisLine={false} tickLine={false} minTickGap={20} />
        <YAxis tickFormatter={(v) => formatMoneyShort(v)} tick={AXIS_TEXT} axisLine={false} tickLine={false} width={70} />
        <Tooltip
          contentStyle={tooltipStyle}
          labelFormatter={(label) => formatShortDate(String(label))}
          formatter={(value) => [formatMoney(Number(value)), 'Revenue']}
        />
        <Area type="monotone" dataKey={dataKey} stroke={SERIES_COLOR} strokeWidth={2} fill="url(#revenueFill)" activeDot={{ r: 5 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/** Vertical bars, one per date (e.g. number of orders per day). */
export function DailyBarChart({ data, dataKey, label }: { data: object[]; dataKey: string; label: string }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={GRID_COLOR} vertical={false} />
        <XAxis dataKey="date" tickFormatter={formatShortDate} tick={AXIS_TEXT} axisLine={false} tickLine={false} minTickGap={20} />
        <YAxis allowDecimals={false} tick={AXIS_TEXT} axisLine={false} tickLine={false} width={40} />
        <Tooltip
          contentStyle={tooltipStyle}
          cursor={{ fill: 'rgba(42,120,214,0.06)' }}
          labelFormatter={(value) => formatShortDate(String(value))}
          formatter={(value) => [formatNumber(Number(value)), label]}
        />
        <Bar dataKey={dataKey} fill={SERIES_COLOR} radius={[4, 4, 0, 0]} maxBarSize={24} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Horizontal bars for comparing named things (e.g. revenue per category). */
export function HorizontalBarChart({ data, labelKey, valueKey }: { data: object[]; labelKey: string; valueKey: string }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 44)}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={GRID_COLOR} horizontal={false} />
        <XAxis type="number" tickFormatter={(v) => formatMoneyShort(v)} tick={AXIS_TEXT} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey={labelKey} tick={AXIS_TEXT} axisLine={false} tickLine={false} width={120} />
        <Tooltip
          contentStyle={tooltipStyle}
          cursor={{ fill: 'rgba(42,120,214,0.06)' }}
          formatter={(value) => [formatMoney(Number(value)), 'Revenue']}
        />
        <Bar dataKey={valueKey} fill={SERIES_COLOR} radius={[0, 4, 4, 0]} maxBarSize={22} />
      </BarChart>
    </ResponsiveContainer>
  );
}
