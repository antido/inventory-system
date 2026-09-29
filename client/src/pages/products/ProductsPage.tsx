import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { api } from '../../api/client';
import { Badge, LoadState, PageHeader, StockBadge } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useFetch } from '../../hooks/useFetch';
import { Category, Product } from '../../types';
import { formatMoney } from '../../utils/format';
import { ProductFormModal } from './ProductFormModal';

export function ProductsPage() {
  const { can } = useAuth();
  const canManage = can('products.manage');

  // Filters - changing any of them changes the URL, which reloads the list.
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [stock, setStock] = useState('');
  const params = new URLSearchParams({ search, categoryId, stock }).toString();

  const { data: products, loading, error, reload } = useFetch<Product[]>(`/products?${params}`);
  const { data: categories } = useFetch<Category[]>('/categories');
  const [editing, setEditing] = useState<Product | 'new' | null>(null);

  async function handleDelete(product: Product) {
    if (!confirm(`Delete "${product.name}"?`)) return;
    try {
      await api.delete(`/products/${product.id}`);
      reload();
    } catch (err) {
      alert(`${(err as Error).message}. Tip: mark the product as inactive instead.`);
    }
  }

  return (
    <>
      <PageHeader
        title="Products"
        description="Your product catalog with prices and current stock."
        actions={
          canManage && (
            <button className="btn btn-primary" onClick={() => setEditing('new')}>
              <Plus size={16} /> Add product
            </button>
          )
        }
      />

      <div className="card">
        <div className="toolbar">
          <div className="search-input">
            <Search size={16} />
            <input placeholder="Search by name or SKU…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">All categories</option>
            {categories?.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <select value={stock} onChange={(e) => setStock(e.target.value)}>
            <option value="">Any stock level</option>
            <option value="low">Low stock</option>
            <option value="out">Out of stock</option>
          </select>
        </div>

        <LoadState loading={loading && !products} error={error} empty={products?.length === 0} />
        {products && products.length > 0 && (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th className="hide-sm">Category</th>
                  <th className="text-right">Price</th>
                  <th className="text-right hide-sm">Cost</th>
                  <th className="text-right">In stock</th>
                  <th>Status</th>
                  {canManage && <th />}
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className={product.isActive ? '' : 'row-inactive'}>
                    <td>
                      <p className="strong">{product.name}</p>
                      <p className="muted small">{product.sku}</p>
                    </td>
                    <td className="hide-sm">{product.categoryName ?? <span className="muted">—</span>}</td>
                    <td className="text-right nowrap">{formatMoney(product.price)}</td>
                    <td className="text-right muted hide-sm">{formatMoney(product.cost)}</td>
                    <td className="text-right strong">{product.quantity}</td>
                    <td>
                      {product.isActive ? (
                        <StockBadge quantity={product.quantity} reorderLevel={product.reorderLevel} />
                      ) : (
                        <Badge color="gray">Inactive</Badge>
                      )}
                    </td>
                    {canManage && (
                      <td className="row-actions">
                        <button className="icon-button" onClick={() => setEditing(product)} title="Edit">
                          <Pencil size={16} />
                        </button>
                        <button className="icon-button danger" onClick={() => handleDelete(product)} title="Delete">
                          <Trash2 size={16} />
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

      {editing && (
        <ProductFormModal
          product={editing === 'new' ? null : editing}
          categories={categories ?? []}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      )}
    </>
  );
}
