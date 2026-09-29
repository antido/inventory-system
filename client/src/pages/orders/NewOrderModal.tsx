import { Plus, Trash2 } from 'lucide-react';
import { api } from '../../api/client';
import { Field, Modal } from '../../components/ui';
import { useFetch } from '../../hooks/useFetch';
import { useForm } from '../../hooks/useForm';
import { Product } from '../../types';
import { formatMoney } from '../../utils/format';

interface OrderLine {
  productId: string;
  quantity: string;
}

export function NewOrderModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { data: allProducts } = useFetch<Product[]>('/products');
  const products = (allProducts ?? []).filter((p) => p.isActive);

  const { values, setValue, saving, error, submit } = useForm({
    customerName: '',
    note: '',
    items: [{ productId: '', quantity: '1' }] as OrderLine[],
  });

  function updateLine(index: number, changes: Partial<OrderLine>) {
    setValue(
      'items',
      values.items.map((line, i) => (i === index ? { ...line, ...changes } : line)),
    );
  }

  function addLine() {
    setValue('items', [...values.items, { productId: '', quantity: '1' }]);
  }

  function removeLine(index: number) {
    setValue(
      'items',
      values.items.filter((_, i) => i !== index),
    );
  }

  const findProduct = (id: string) => products.find((p) => String(p.id) === id);
  const total = values.items.reduce((sum, line) => {
    const product = findProduct(line.productId);
    return sum + (product ? product.price * Number(line.quantity) : 0);
  }, 0);

  async function handleSubmit() {
    const items = values.items
      .filter((line) => line.productId)
      .map((line) => ({ productId: Number(line.productId), quantity: Number(line.quantity) }));

    const ok = await submit(() => api.post('/orders', { ...values, items }));
    if (ok) onSaved();
  }

  return (
    <Modal title="New order" onClose={onClose} onSubmit={handleSubmit} saving={saving} error={error} submitLabel="Create order" wide>
      <Field label="Customer name">
        <input value={values.customerName} onChange={(e) => setValue('customerName', e.target.value)} required autoFocus />
      </Field>

      <p className="field-label">Items</p>
      <div className="order-lines">
        {values.items.map((line, index) => {
          const product = findProduct(line.productId);
          return (
            <div key={index} className="order-line">
              <select value={line.productId} onChange={(e) => updateLine(index, { productId: e.target.value })} required>
                <option value="">Select a product…</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id} disabled={p.quantity === 0}>
                    {p.name} — {formatMoney(p.price)} ({p.quantity} left)
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                max={product?.quantity}
                value={line.quantity}
                onChange={(e) => updateLine(index, { quantity: e.target.value })}
                required
                aria-label="Quantity"
              />
              <span className="order-line-total">{product ? formatMoney(product.price * Number(line.quantity)) : '—'}</span>
              <button
                type="button"
                className="icon-button danger"
                onClick={() => removeLine(index)}
                disabled={values.items.length === 1}
                aria-label="Remove line"
              >
                <Trash2 size={16} />
              </button>
            </div>
          );
        })}
      </div>
      <button type="button" className="btn btn-secondary btn-small" onClick={addLine}>
        <Plus size={14} /> Add item
      </button>

      <Field label="Note (optional)">
        <input value={values.note} onChange={(e) => setValue('note', e.target.value)} />
      </Field>

      <div className="order-total">
        <span>Total</span>
        <strong>{formatMoney(total)}</strong>
      </div>
    </Modal>
  );
}
