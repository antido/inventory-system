import { ArrowDownToLine, ArrowUpFromLine, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { Badge, LoadState, PageHeader, StockBadge } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useFetch } from '../../hooks/useFetch';
import { MovementType, Product, StockMovement } from '../../types';
import { formatDateTime } from '../../utils/format';
import { StockAdjustModal } from './StockAdjustModal';

const MOVEMENT_LABELS: Record<MovementType, { label: string; color: 'green' | 'red' | 'blue' | 'amber' | 'gray' }> = {
  in: { label: 'Stock in', color: 'green' },
  out: { label: 'Stock out', color: 'red' },
  adjustment: { label: 'Adjustment', color: 'blue' },
  sale: { label: 'Sale', color: 'amber' },
  return: { label: 'Return', color: 'gray' },
};

export function StockPage() {
  const { can } = useAuth();
  const canManage = can('stock.manage');
  const [tab, setTab] = useState<'levels' | 'history'>('levels');

  const products = useFetch<Product[]>('/products');
  const movements = useFetch<StockMovement[]>('/stock/movements');

  // Which product + action the adjust modal is open for (null = closed).
  const [adjusting, setAdjusting] = useState<{ product?: Product; type: 'in' | 'out' | 'adjustment' } | null>(null);

  function refreshAll() {
    products.reload();
    movements.reload();
  }

  return (
    <>
      <PageHeader
        title="Stock Control"
        description="Receive new stock, remove damaged items and correct counts. Every change is logged."
        actions={
          canManage && (
            <>
              <button className="btn btn-secondary" onClick={() => setAdjusting({ type: 'out' })}>
                <ArrowUpFromLine size={16} /> Remove stock
              </button>
              <button className="btn btn-primary" onClick={() => setAdjusting({ type: 'in' })}>
                <ArrowDownToLine size={16} /> Receive stock
              </button>
            </>
          )
        }
      />

      <div className="tabs">
        <button className={tab === 'levels' ? 'active' : ''} onClick={() => setTab('levels')}>
          Stock levels
        </button>
        <button className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')}>
          Movement history
        </button>
      </div>

      {tab === 'levels' && (
        <div className="card">
          <LoadState loading={products.loading && !products.data} error={products.error} />
          {products.data && (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th className="text-right">On hand</th>
                    <th className="text-right hide-sm">Reorder at</th>
                    <th>Status</th>
                    {canManage && <th />}
                  </tr>
                </thead>
                <tbody>
                  {products.data.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <p className="strong">{product.name}</p>
                        <p className="muted small">{product.sku}</p>
                      </td>
                      <td className="text-right strong">{product.quantity}</td>
                      <td className="text-right muted hide-sm">{product.reorderLevel}</td>
                      <td>
                        <StockBadge quantity={product.quantity} reorderLevel={product.reorderLevel} />
                      </td>
                      {canManage && (
                        <td className="row-actions">
                          <button
                            className="btn btn-secondary btn-small"
                            onClick={() => setAdjusting({ product, type: 'adjustment' })}
                            title="Adjust stock"
                            aria-label={`Adjust stock of ${product.name}`}
                          >
                            <SlidersHorizontal size={14} /> <span className="hide-sm">Adjust</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div className="card">
          <LoadState loading={movements.loading && !movements.data} error={movements.error} empty={movements.data?.length === 0} />
          {movements.data && movements.data.length > 0 && (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th className="hide-sm">Date</th>
                    <th>Product</th>
                    <th>Type</th>
                    <th className="text-right">Change</th>
                    <th className="text-right hide-sm">Balance</th>
                    <th className="hide-sm">Note</th>
                    <th className="hide-sm">By</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.data.map((movement) => (
                    <tr key={movement.id}>
                      <td className="muted small nowrap hide-sm">{formatDateTime(movement.createdAt)}</td>
                      <td>
                        <p className="strong">{movement.productName}</p>
                        <p className="muted small">{movement.sku}</p>
                        <p className="muted small show-sm">{formatDateTime(movement.createdAt)}</p>
                      </td>
                      <td>
                        <Badge color={MOVEMENT_LABELS[movement.type].color}>{MOVEMENT_LABELS[movement.type].label}</Badge>
                      </td>
                      <td className={`text-right strong ${movement.quantityChange < 0 ? 'text-negative' : 'text-positive'}`}>
                        {movement.quantityChange > 0 ? '+' : ''}
                        {movement.quantityChange}
                      </td>
                      <td className="text-right hide-sm">{movement.quantityAfter}</td>
                      <td className="muted hide-sm">{movement.note}</td>
                      <td className="muted small hide-sm">{movement.userName ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {adjusting && (
        <StockAdjustModal
          products={products.data ?? []}
          initialProduct={adjusting.product}
          initialType={adjusting.type}
          onClose={() => setAdjusting(null)}
          onSaved={() => {
            setAdjusting(null);
            refreshAll();
          }}
        />
      )}
    </>
  );
}
