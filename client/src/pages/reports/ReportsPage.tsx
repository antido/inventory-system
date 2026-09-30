import { DollarSign, Package, Receipt, ShoppingBag, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { DailyBarChart, HorizontalBarChart, RevenueAreaChart } from '../../components/charts';
import { LoadState, PageHeader, StatCard } from '../../components/ui';
import { useFetch } from '../../hooks/useFetch';
import { ReportData } from '../../types';
import { formatMoney, formatNumber, isoDate } from '../../utils/format';

const PRESETS = [
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
];

export function ReportsPage() {
  const [from, setFrom] = useState(isoDate(29));
  const [to, setTo] = useState(isoDate(0));
  const { data, loading, error } = useFetch<ReportData>(`/reports?from=${from}&to=${to}`);

  function applyPreset(days: number) {
    setFrom(isoDate(days - 1));
    setTo(isoDate(0));
  }

  return (
    <>
      <PageHeader title="Reports & Analytics" description="Sales performance and inventory value. Cancelled orders are excluded." />

      {/* Date range filter */}
      <div className="card toolbar">
        <div className="segmented">
          {PRESETS.map((preset) => (
            <button
              key={preset.days}
              type="button"
              className={from === isoDate(preset.days - 1) && to === isoDate(0) ? 'active' : ''}
              onClick={() => applyPreset(preset.days)}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <label className="inline-field">
          From <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label className="inline-field">
          To <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} />
        </label>
      </div>

      <LoadState loading={loading && !data} error={error} />

      {data && (
        <>
          <div className="stat-grid">
            <StatCard label="Revenue" value={formatMoney(data.summary.revenue)} icon={<DollarSign size={20} />} />
            <StatCard label="Gross profit" value={formatMoney(data.summary.grossProfit)} icon={<TrendingUp size={20} />} hint="Revenue minus cost of items sold" />
            <StatCard label="Orders" value={formatNumber(data.summary.orderCount)} icon={<Receipt size={20} />} />
            <StatCard label="Avg. order value" value={formatMoney(data.summary.averageOrderValue)} icon={<ShoppingBag size={20} />} />
            <StatCard label="Items sold" value={formatNumber(data.summary.itemsSold)} icon={<Package size={20} />} />
          </div>

          <div className="card">
            <div className="card-header">
              <h2>Revenue per day</h2>
            </div>
            <RevenueAreaChart data={data.dailySales} dataKey="revenue" />
          </div>

          <div className="two-columns">
            <div className="card">
              <div className="card-header">
                <h2>Orders per day</h2>
              </div>
              <DailyBarChart data={data.dailySales} dataKey="orders" label="Orders" />
            </div>
            <div className="card">
              <div className="card-header">
                <h2>Revenue by category</h2>
              </div>
              {data.salesByCategory.length > 0 ? (
                <HorizontalBarChart data={data.salesByCategory} labelKey="category" valueKey="revenue" />
              ) : (
                <p className="state-message">No sales in this period.</p>
              )}
            </div>
          </div>

          <div className="two-columns">
            <div className="card">
              <div className="card-header">
                <h2>Top products</h2>
              </div>
              <div className="table-scroll">
                <table className="table">
                  <thead>
                    <tr>
                      <th className="hide-sm">#</th>
                      <th>Product</th>
                      <th className="text-right">Units</th>
                      <th className="text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topProducts.map((product, index) => (
                      <tr key={product.id}>
                        <td className="muted hide-sm">{index + 1}</td>
                        <td>
                          <p className="strong">{product.name}</p>
                          <p className="muted small">{product.sku}</p>
                        </td>
                        <td className="text-right">{formatNumber(product.quantitySold)}</td>
                        <td className="text-right strong nowrap">{formatMoney(product.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {data.topProducts.length === 0 && <p className="state-message">No sales in this period.</p>}
            </div>

            <div className="card">
              <div className="card-header">
                <h2>Inventory value (today)</h2>
              </div>
              <div className="table-scroll">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th className="text-right">Units</th>
                      <th className="text-right">At cost</th>
                      <th className="text-right hide-sm">At retail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.inventoryByCategory.map((row) => (
                      <tr key={row.category}>
                        <td className="strong">{row.category}</td>
                        <td className="text-right">{formatNumber(row.units)}</td>
                        <td className="text-right nowrap">{formatMoney(row.costValue)}</td>
                        <td className="text-right muted nowrap hide-sm">{formatMoney(row.retailValue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
