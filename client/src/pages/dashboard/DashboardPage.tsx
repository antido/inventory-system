import { AlertTriangle, CalendarDays, Clock, DollarSign, Package, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { RevenueAreaChart } from '../../components/charts';
import { LoadState, OrderStatusBadge, PageHeader, StatCard, StockBadge } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useFetch } from '../../hooks/useFetch';
import { DashboardData } from '../../types';
import { formatDateTime, formatMoney, formatNumber } from '../../utils/format';

export function DashboardPage() {
  const { user } = useAuth();
  const { data, loading, error } = useFetch<DashboardData>('/dashboard');

  return (
    <>
      <PageHeader title={`Hello, ${user?.name.split(' ')[0]} 👋`} description="Here's what is happening in your inventory today." />

      <LoadState loading={loading && !data} error={error} />

      {data && (
        <>
          <div className="stat-grid stat-grid-3">
            <StatCard label="Revenue this month" value={formatMoney(data.stats.revenueThisMonth)} icon={<DollarSign size={20} />} />
            <StatCard label="Orders today" value={formatNumber(data.stats.ordersToday)} icon={<CalendarDays size={20} />} />
            <StatCard label="Pending orders" value={formatNumber(data.stats.pendingOrders)} icon={<Clock size={20} />} />
            <StatCard label="Active products" value={formatNumber(data.stats.totalProducts)} icon={<Package size={20} />} />
            <StatCard
              label="Low stock items"
              value={formatNumber(data.stats.lowStockCount)}
              icon={<AlertTriangle size={20} />}
              hint="At or below reorder level"
            />
            <StatCard label="Stock value (cost)" value={formatMoney(data.stats.stockValue)} icon={<Wallet size={20} />} />
          </div>

          <div className="card">
            <div className="card-header">
              <h2>Sales · last 7 days</h2>
            </div>
            <RevenueAreaChart data={data.salesLast7Days} dataKey="total" />
          </div>

          <div className="two-columns">
            <div className="card">
              <div className="card-header">
                <h2>Recent orders</h2>
                <Link to="/orders" className="link">
                  View all
                </Link>
              </div>
              <table className="table">
                <tbody>
                  {data.recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <p className="strong">{order.orderNumber}</p>
                        <p className="muted small">{order.customerName}</p>
                      </td>
                      <td className="muted small">{formatDateTime(order.createdAt)}</td>
                      <td>
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td className="text-right strong">{formatMoney(order.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.recentOrders.length === 0 && <p className="state-message">No orders yet.</p>}
            </div>

            <div className="card">
              <div className="card-header">
                <h2>Low stock alerts</h2>
                <Link to="/stock" className="link">
                  Manage stock
                </Link>
              </div>
              <table className="table">
                <tbody>
                  {data.lowStock.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <p className="strong">{product.name}</p>
                        <p className="muted small">{product.sku}</p>
                      </td>
                      <td className="small muted">
                        {product.quantity} / {product.reorderLevel}
                      </td>
                      <td className="text-right">
                        <StockBadge quantity={product.quantity} reorderLevel={product.reorderLevel} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.lowStock.length === 0 && <p className="state-message">All products are well stocked. 🎉</p>}
            </div>
          </div>
        </>
      )}
    </>
  );
}
