// Read-only view of one product: photo (or "No Image"), prices, stock and description.
import { Pencil } from 'lucide-react';
import { Badge, ImageBox, Modal, StockBadge } from '../../components/ui';
import { Product } from '../../types';
import { formatMoney, formatNumber } from '../../utils/format';

interface Props {
  product: Product;
  canEdit: boolean;
  onEdit: () => void;
  onClose: () => void;
}

export function ProductDetailsModal({ product, canEdit, onEdit, onClose }: Props) {
  const margin = product.price - product.cost;

  return (
    <Modal title="Product details" onClose={onClose} wide>
      <div className="product-details">
        <ImageBox url={product.imageUrl} alt={product.name} className="image-box-large" />

        <div className="product-details-info">
          <div>
            <h3>{product.name}</h3>
            <p className="muted">
              {product.sku} · {product.categoryName ?? 'Uncategorized'}
            </p>
          </div>

          <div>
            {product.isActive ? (
              <StockBadge quantity={product.quantity} reorderLevel={product.reorderLevel} />
            ) : (
              <Badge color="gray">Inactive</Badge>
            )}
          </div>

          <dl className="details-list">
            <div>
              <dt>Selling price</dt>
              <dd>{formatMoney(product.price)}</dd>
            </div>
            <div>
              <dt>Cost price</dt>
              <dd>{formatMoney(product.cost)}</dd>
            </div>
            <div>
              <dt>Margin per unit</dt>
              <dd className={margin < 0 ? 'text-negative' : ''}>{formatMoney(margin)}</dd>
            </div>
            <div>
              <dt>In stock</dt>
              <dd>{formatNumber(product.quantity)}</dd>
            </div>
            <div>
              <dt>Reorder level</dt>
              <dd>{formatNumber(product.reorderLevel)}</dd>
            </div>
            <div>
              <dt>Stock value (cost)</dt>
              <dd>{formatMoney(product.quantity * product.cost)}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div>
        <p className="field-label">Description</p>
        <p className={product.description ? '' : 'muted'}>{product.description || 'No description.'}</p>
      </div>

      {canEdit && (
        <div className="status-actions">
          <button type="button" className="btn btn-primary" onClick={onEdit}>
            <Pencil size={16} /> Edit product
          </button>
        </div>
      )}
    </Modal>
  );
}
