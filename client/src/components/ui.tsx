// Small reusable UI pieces used by many pages.
import { ImageOff, X } from 'lucide-react';
import { FormEvent, ReactNode, useState } from 'react';
import { OrderStatus } from '../types';

/** Title + optional description and action buttons at the top of a page. */
export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {description && <p className="muted">{description}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}

/** A number with a label, used on the dashboard and reports. */
export function StatCard({ label, value, icon, hint }: { label: string; value: string; icon: ReactNode; hint?: string }) {
  return (
    <div className="card stat-card">
      <div className="stat-icon">{icon}</div>
      <div>
        <p className="stat-label">{label}</p>
        <p className="stat-value">{value}</p>
        {hint && <p className="stat-hint">{hint}</p>}
      </div>
    </div>
  );
}

/** A popup dialog with a form inside. */
export function Modal({
  title,
  onClose,
  onSubmit,
  children,
  submitLabel = 'Save',
  saving = false,
  error,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  onSubmit?: () => void;
  children: ReactNode;
  submitLabel?: string;
  saving?: boolean;
  error?: string;
  wide?: boolean;
}) {
  function handleSubmit(event: FormEvent) {
    event.preventDefault(); // stop the browser from reloading the page
    onSubmit?.();
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <form
        className={`modal ${wide ? 'modal-wide' : ''}`}
        onMouseDown={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="modal-header">
          <h2>{title}</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}
          {children}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            {onSubmit ? 'Cancel' : 'Close'}
          </button>
          {onSubmit && (
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : submitLabel}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

/** A labelled form field. Put an <input>, <select> or <textarea> inside. */
export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

type BadgeColor = 'green' | 'red' | 'amber' | 'blue' | 'gray';

export function Badge({ color, children }: { color: BadgeColor; children: ReactNode }) {
  return <span className={`badge badge-${color}`}>{children}</span>;
}

const ORDER_STATUS_COLORS: Record<OrderStatus, BadgeColor> = {
  pending: 'amber',
  completed: 'green',
  cancelled: 'gray',
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return <Badge color={ORDER_STATUS_COLORS[status]}>{label}</Badge>;
}

/** Shows "Out of stock" / "Low stock" / "In stock" for a product. */
export function StockBadge({ quantity, reorderLevel }: { quantity: number; reorderLevel: number }) {
  if (quantity === 0) return <Badge color="red">Out of stock</Badge>;
  if (quantity <= reorderLevel) return <Badge color="amber">Low stock</Badge>;
  return <Badge color="green">In stock</Badge>;
}

/** Loading / error / empty messages for tables and lists. */
export function LoadState({ loading, error, empty }: { loading: boolean; error: string; empty?: boolean }) {
  if (loading) return <p className="state-message">Loading…</p>;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (empty) return <p className="state-message">Nothing here yet.</p>;
  return null;
}

/**
 * A photo, or a grey "No Image" box when there is none (or it fails to load).
 * Size it with a class, e.g. <ImageBox url={product.imageUrl} alt={product.name} className="image-box-large" />
 */
export function ImageBox({ url, alt, className = '' }: { url: string | null; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className={`image-box ${className}`}>
      {url && !failed ? (
        <img src={url} alt={alt} onError={() => setFailed(true)} />
      ) : (
        <div className="image-placeholder" role="img" aria-label="No Image">
          <ImageOff size={28} />
          <span>No Image</span>
        </div>
      )}
    </div>
  );
}
