// Chart components built with Recharts, styled to match the app.
// Each chart shows a single series, so it uses one color and needs no legend.
// Colors follow the light / dark theme. The chart height comes from CSS
// (.chart / .chart-sm in styles.css), so it can shrink on phones.
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Theme, useTheme } from '../context/ThemeContext';
import { formatMoney, formatMoneyShort, formatNumber, formatShortDate } from '../utils/format';

const CHART_COLORS: Record<Theme, { series: string; grid: string; axis: string; cursor: string }> = {
  light: { series: '#2a78d6', grid: '#eceef1', axis: '#6b7280', cursor: 'rgba(42,120,214,0.08)' },
  dark: { series: '#3987e5', grid: '#272d39', axis: '#8c94a3', cursor: 'rgba(57,135,229,0.14)' },
};

/** Tooltip box uses the theme's CSS variables, so it matches cards and modals. */
const tooltipStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  boxShadow: 'var(--shadow-lg)',
  color: 'var(--text)',
  fontSize: 13,
};

function useChartColors() {
  const { theme } = useTheme();
  const colors = CHART_COLORS[theme];
  return { ...colors, tick: { fontSize: 12, fill: colors.axis } };
}

/** Money over time, e.g. daily revenue. */
export function RevenueAreaChart({ data, dataKey }: { data: object[]; dataKey: string }) {
  const colors = useChartColors();

  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors.series} stopOpacity={0.24} />
              <stop offset="100%" stopColor={colors.series} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={colors.grid} vertical={false} />
          <XAxis dataKey="date" tickFormatter={formatShortDate} tick={colors.tick} axisLine={false} tickLine={false} minTickGap={24} />
          <YAxis tickFormatter={(v) => formatMoneyShort(v)} tick={colors.tick} axisLine={false} tickLine={false} width={64} />
          <Tooltip
            contentStyle={tooltipStyle}
            itemStyle={{ color: 'var(--text)' }}
            cursor={{ stroke: colors.axis, strokeDasharray: '3 3' }}
            labelFormatter={(label) => formatShortDate(String(label))}
            formatter={(value) => [formatMoney(Number(value)), 'Revenue']}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={colors.series}
            strokeWidth={2}
            fill="url(#revenueFill)"
            activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--surface)' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Vertical bars, one per date (e.g. number of orders per day). */
export function DailyBarChart({ data, dataKey, label }: { data: object[]; dataKey: string; label: string }) {
  const colors = useChartColors();

  return (
    <div className="chart chart-sm">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={colors.grid} vertical={false} />
          <XAxis dataKey="date" tickFormatter={formatShortDate} tick={colors.tick} axisLine={false} tickLine={false} minTickGap={24} />
          <YAxis allowDecimals={false} tick={colors.tick} axisLine={false} tickLine={false} width={32} />
          <Tooltip
            contentStyle={tooltipStyle}
            itemStyle={{ color: 'var(--text)' }}
            cursor={{ fill: colors.cursor }}
            labelFormatter={(value) => formatShortDate(String(value))}
            formatter={(value) => [formatNumber(Number(value)), label]}
          />
          <Bar dataKey={dataKey} fill={colors.series} radius={[4, 4, 0, 0]} maxBarSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Horizontal bars for comparing named things (e.g. revenue per category). */
export function HorizontalBarChart({ data, labelKey, valueKey }: { data: object[]; labelKey: string; valueKey: string }) {
  const colors = useChartColors();

  return (
    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 44)}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={colors.grid} horizontal={false} />
        <XAxis type="number" tickFormatter={(v) => formatMoneyShort(v)} tick={colors.tick} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey={labelKey} tick={colors.tick} axisLine={false} tickLine={false} width={104} />
        <Tooltip
          contentStyle={tooltipStyle}
          itemStyle={{ color: 'var(--text)' }}
          cursor={{ fill: colors.cursor }}
          formatter={(value) => [formatMoney(Number(value)), 'Revenue']}
        />
        <Bar dataKey={valueKey} fill={colors.series} radius={[0, 4, 4, 0]} maxBarSize={22} />
      </BarChart>
    </ResponsiveContainer>
  );
}
