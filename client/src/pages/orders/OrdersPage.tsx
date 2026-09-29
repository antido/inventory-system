import { Eye, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { LoadState, OrderStatusBadge, PageHeader } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useFetch } from '../../hooks/useFetch';
import { Order } from '../../types';
import { formatDateTime, formatMoney } from '../../utils/format';
import { NewOrderModal } from './NewOrderModal';
import { OrderDetailsModal } from './OrderDetailsModal';

const STATUS_FILTERS = ['', 'pending', 'completed', 'cancelled'];

export function OrdersPage() {
  const { can } = useAuth();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const params = new URLSearchParams({ search, status }).toString();

  const { data: orders, loading, error, reload } = useFetch<Order[]>(`/orders?${params}`);
  const [creating, setCreating] = useState(false);
  const [viewingId, setViewingId] = useState<number | null>(null);

  return (
    <>
      <PageHeader
        title="Orders"
        description="Customer orders. Creating an order takes the items out of stock."
        actions={
          can('orders.create') && (
            <button className="btn btn-primary" onClick={() => setCreating(true)}>
              <Plus size={16} /> New order
            </button>
          )
        }
      />

      <div className="card">
        <div className="toolbar">
          <div className="search-input">
            <Search size={16} />
            <input placeholder="Search order # or customer…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="segmented">
            {STATUS_FILTERS.map((value) => (
              <button key={value} type="button" className={status === value ? 'active' : ''} onClick={() => setStatus(value)}>
                {value || 'All'}
              </button>
            ))}
          </div>
        </div>

        <LoadState loading={loading && !orders} error={error} empty={orders?.length === 0} />
        {orders && orders.length > 0 && (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th className="text-right">Items</th>
                  <th className="text-right">Total</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="clickable" onClick={() => setViewingId(order.id)}>
                    <td className="strong">{order.orderNumber}</td>
                    <td>{order.customerName}</td>
                    <td className="muted small nowrap">{formatDateTime(order.createdAt)}</td>
                    <td className="text-right">{order.itemCount}</td>
                    <td className="text-right strong">{formatMoney(order.total)}</td>
                    <td>
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="row-actions">
                      <button className="icon-button" title="View">
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {creating && (
        <NewOrderModal
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            reload();
          }}
        />
      )}

      {viewingId && (
        <OrderDetailsModal
          orderId={viewingId}
          onClose={() => setViewingId(null)}
          onChanged={() => {
            setViewingId(null);
            reload();
          }}
        />
      )}
    </>
  );
}
