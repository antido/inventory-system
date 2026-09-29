import { api } from '../../api/client';
import { Field, Modal } from '../../components/ui';
import { useForm } from '../../hooks/useForm';
import { Category, Product } from '../../types';

interface Props {
  product: Product | null; // null = create a new product
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}

export function ProductFormModal({ product, categories, onClose, onSaved }: Props) {
  const { values, setValue, saving, error, submit } = useForm({
    sku: product?.sku ?? '',
    name: product?.name ?? '',
    description: product?.description ?? '',
    categoryId: product?.categoryId ? String(product.categoryId) : '',
    price: product ? String(product.price) : '',
    cost: product ? String(product.cost) : '',
    reorderLevel: product ? String(product.reorderLevel) : '10',
    initialQuantity: '0',
    isActive: product?.isActive ?? true,
  });

  async function handleSubmit() {
    const ok = await submit(() => (product ? api.put(`/products/${product.id}`, values) : api.post('/products', values)));
    if (ok) onSaved();
  }

  return (
    <Modal title={product ? 'Edit product' : 'Add product'} onClose={onClose} onSubmit={handleSubmit} saving={saving} error={error} wide>
      <div className="form-row">
        <Field label="Product name">
          <input value={values.name} onChange={(e) => setValue('name', e.target.value)} required />
        </Field>
        <Field label="SKU" hint="Unique product code">
          <input value={values.sku} onChange={(e) => setValue('sku', e.target.value)} required />
        </Field>
      </div>

      <Field label="Description">
        <textarea rows={2} value={values.description} onChange={(e) => setValue('description', e.target.value)} />
      </Field>

      <div className="form-row">
        <Field label="Category">
          <select value={values.categoryId} onChange={(e) => setValue('categoryId', e.target.value)}>
            <option value="">Uncategorized</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Reorder level" hint="Show a low stock alert at or below this amount">
          <input type="number" min={0} value={values.reorderLevel} onChange={(e) => setValue('reorderLevel', e.target.value)} required />
        </Field>
      </div>

      <div className="form-row">
        <Field label="Selling price (₱)">
          <input type="number" min={0} step="0.01" value={values.price} onChange={(e) => setValue('price', e.target.value)} required />
        </Field>
        <Field label="Cost price (₱)">
          <input type="number" min={0} step="0.01" value={values.cost} onChange={(e) => setValue('cost', e.target.value)} required />
        </Field>
      </div>

      {product ? (
        <p className="muted small">
          Current stock: <strong>{product.quantity}</strong>. To change it, use <strong>Stock Control</strong> so the change is
          recorded.
        </p>
      ) : (
        <Field label="Opening stock" hint="How many units you have right now">
          <input
            type="number"
            min={0}
            value={values.initialQuantity}
            onChange={(e) => setValue('initialQuantity', e.target.value)}
          />
        </Field>
      )}

      <label className="checkbox">
        <input type="checkbox" checked={values.isActive} onChange={(e) => setValue('isActive', e.target.checked)} />
        Active (available for new orders)
      </label>
    </Modal>
  );
}
