import { useState } from 'react';
import { api } from '../../api/client';
import { LoadState, Modal, OrderStatusBadge } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useFetch } from '../../hooks/useFetch';
import { OrderDetails } from '../../types';
import { formatDateTime, formatMoney } from '../../utils/format';

interface Props {
  orderId: number;
  onClose: () => void;
  onChanged: () => void;
}

export function OrderDetailsModal({ orderId, onClose, onChanged }: Props) {
  const { can } = useAuth();
  const { data: order, loading, error } = useFetch<OrderDetails>(`/orders/${orderId}`);
  const [actionError, setActionError] = useState('');
  const [saving, setSaving] = useState(false);

  async function changeStatus(status: 'completed' | 'cancelled') {
    const message =
      status === 'cancelled' ? 'Cancel this order? Its items will be returned to stock.' : 'Mark this order as completed?';
    if (!confirm(message)) return;

    setSaving(true);
    try {
      await api.patch(`/orders/${orderId}/status`, { status });
      onChanged();
    } catch (err) {
      setActionError((err as Error).message);
      setSaving(false);
    }
  }

  return (
    <Modal title={order ? `Order ${order.orderNumber}` : 'Order'} onClose={onClose} error={actionError} wide>
      <LoadState loading={loading} error={error} />
      {order && (
        <>
          <div className="details-grid">
            <div>
              <p className="muted small">Customer</p>
              <p className="strong">{order.customerName}</p>
            </div>
            <div>
              <p className="muted small">Date</p>
              <p>{formatDateTime(order.createdAt)}</p>
            </div>
            <div>
              <p className="muted small">Created by</p>
              <p>{order.createdBy ?? '—'}</p>
            </div>
            <div>
              <p className="muted small">Status</p>
              <OrderStatusBadge status={order.status} />
            </div>
          </div>

          {order.note && <p className="muted">Note: {order.note}</p>}

          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th className="text-right">Qty</th>
                  <th className="text-right hide-sm">Unit price</th>
                  <th className="text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <p className="strong">{item.productName}</p>
                      <p className="muted small">{item.sku}</p>
                    </td>
                    <td className="text-right">{item.quantity}</td>
                    <td className="text-right hide-sm">{formatMoney(item.unitPrice)}</td>
                    <td className="text-right nowrap">{formatMoney(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="order-total">
            <span>Total</span>
            <strong>{formatMoney(order.total)}</strong>
          </div>

          {order.status === 'pending' && can('orders.manage') && (
            <div className="status-actions">
              <button type="button" className="btn btn-ghost-danger" disabled={saving} onClick={() => changeStatus('cancelled')}>
                Cancel order
              </button>
              <button type="button" className="btn btn-success" disabled={saving} onClick={() => changeStatus('completed')}>
                Mark as completed
              </button>
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
