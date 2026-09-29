import { api } from '../../api/client';
import { Field, Modal } from '../../components/ui';
import { useForm } from '../../hooks/useForm';
import { Product } from '../../types';

type AdjustType = 'in' | 'out' | 'adjustment';

const TYPE_OPTIONS: { value: AdjustType; label: string; help: string }[] = [
  { value: 'in', label: 'Receive', help: 'Add units (e.g. a delivery arrived)' },
  { value: 'out', label: 'Remove', help: 'Take units away (e.g. damaged or lost)' },
  { value: 'adjustment', label: 'Set count', help: 'Set the exact amount after counting' },
];

interface Props {
  products: Product[];
  initialProduct?: Product;
  initialType: AdjustType;
  onClose: () => void;
  onSaved: () => void;
}

export function StockAdjustModal({ products, initialProduct, initialType, onClose, onSaved }: Props) {
  const { values, setValue, saving, error, submit } = useForm({
    productId: initialProduct ? String(initialProduct.id) : '',
    type: initialType,
    quantity: initialType === 'adjustment' && initialProduct ? String(initialProduct.quantity) : '',
    note: '',
  });

  const selected = products.find((p) => String(p.id) === values.productId);

  // Preview of the stock level after saving.
  const amount = Number(values.quantity) || 0;
  let newQuantity: number | null = null;
  if (selected) {
    if (values.type === 'in') newQuantity = selected.quantity + amount;
    if (values.type === 'out') newQuantity = selected.quantity - amount;
    if (values.type === 'adjustment') newQuantity = amount;
  }

  async function handleSubmit() {
    const ok = await submit(() => api.post('/stock/adjust', values));
    if (ok) onSaved();
  }

  return (
    <Modal title="Update stock" onClose={onClose} onSubmit={handleSubmit} saving={saving} error={error}>
      <Field label="Product">
        <select value={values.productId} onChange={(e) => setValue('productId', e.target.value)} required>
          <option value="">Select a product…</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name} ({product.sku}) — {product.quantity} in stock
            </option>
          ))}
        </select>
      </Field>

      <div className="segmented">
        {TYPE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={values.type === option.value ? 'active' : ''}
            onClick={() => setValue('type', option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      <p className="muted small">{TYPE_OPTIONS.find((o) => o.value === values.type)?.help}</p>

      <Field label={values.type === 'adjustment' ? 'Counted quantity' : 'Quantity'}>
        <input type="number" min={0} value={values.quantity} onChange={(e) => setValue('quantity', e.target.value)} required />
      </Field>
      <Field label="Note (optional)">
        <input
          value={values.note}
          onChange={(e) => setValue('note', e.target.value)}
          placeholder="e.g. Supplier delivery #1234"
        />
      </Field>

      {selected && newQuantity !== null && (
        <div className={`alert ${newQuantity < 0 ? 'alert-error' : 'alert-info'}`}>
          {selected.quantity} → <strong>{newQuantity}</strong> units
          {newQuantity < 0 && ' (not enough stock)'}
        </div>
      )}
    </Modal>
  );
}
