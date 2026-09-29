import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { api } from '../../api/client';
import { Field, LoadState, Modal, PageHeader } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useFetch } from '../../hooks/useFetch';
import { useForm } from '../../hooks/useForm';
import { Category } from '../../types';

export function CategoriesPage() {
  const { can } = useAuth();
  const { data: categories, loading, error, reload } = useFetch<Category[]>('/categories');
  const [editing, setEditing] = useState<Category | 'new' | null>(null);
  const canManage = can('products.manage');

  async function handleDelete(category: Category) {
    if (!confirm(`Delete "${category.name}"? Its products will become uncategorized.`)) return;
    try {
      await api.delete(`/categories/${category.id}`);
      reload();
    } catch (err) {
      alert((err as Error).message);
    }
  }

  return (
    <>
      <PageHeader
        title="Categories"
        description="Group products to keep the catalog organised."
        actions={
          canManage && (
            <button className="btn btn-primary" onClick={() => setEditing('new')}>
              <Plus size={16} /> Add category
            </button>
          )
        }
      />

      <div className="card">
        <LoadState loading={loading && !categories} error={error} empty={categories?.length === 0} />
        {categories && categories.length > 0 && (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th className="hide-sm">Description</th>
                  <th className="text-right">Products</th>
                  {canManage && <th />}
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td className="strong">{category.name}</td>
                    <td className="muted hide-sm">{category.description}</td>
                    <td className="text-right">{category.productCount}</td>
                    {canManage && (
                      <td className="row-actions">
                        <button className="icon-button" onClick={() => setEditing(category)} title="Edit">
                          <Pencil size={16} />
                        </button>
                        <button className="icon-button danger" onClick={() => handleDelete(category)} title="Delete">
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
        <CategoryFormModal
          category={editing === 'new' ? null : editing}
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

function CategoryFormModal({
  category,
  onClose,
  onSaved,
}: {
  category: Category | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { values, setValue, saving, error, submit } = useForm({
    name: category?.name ?? '',
    description: category?.description ?? '',
  });

  async function handleSubmit() {
    const ok = await submit(() =>
      category ? api.put(`/categories/${category.id}`, values) : api.post('/categories', values),
    );
    if (ok) onSaved();
  }

  return (
    <Modal title={category ? 'Edit category' : 'Add category'} onClose={onClose} onSubmit={handleSubmit} saving={saving} error={error}>
      <Field label="Name">
        <input value={values.name} onChange={(e) => setValue('name', e.target.value)} required />
      </Field>
      <Field label="Description">
        <input value={values.description} onChange={(e) => setValue('description', e.target.value)} />
      </Field>
    </Modal>
  );
}
