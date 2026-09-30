// Photo field for forms: shows the current photo (or "No Image"), lets the
// user pick a new one, optimizes it in the browser, and can remove it.
// The optimized photo is handed to the form as a data URL through onPick().
import { ImagePlus, Trash2 } from 'lucide-react';
import { ChangeEvent, useRef, useState } from 'react';
import { formatBytes, MAX_UPLOAD_BYTES, optimizeImage } from '../utils/image';
import { ImageBox } from './ui';

interface Props {
  /** The photo already saved on the product (edit form), or null. */
  savedUrl: string | null;
  /** A newly picked photo that isn't saved yet, or null. */
  newImage: string | null;
  /** true when the user pressed "Remove" for the saved photo. */
  removed: boolean;
  onPick: (dataUrl: string) => void;
  onRemove: () => void;
}

export function ImagePicker({ savedUrl, newImage, removed, onPick, onRemove }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // What to show: the new photo first, then the saved one (unless removed).
  const shownUrl = newImage ?? (removed ? null : savedUrl);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ''; // so picking the same file again still triggers onChange
    if (!file) return;

    setBusy(true);
    setError('');
    setMessage('Optimizing photo…');
    try {
      const image = await optimizeImage(file);
      onPick(image.dataUrl);
      setMessage(`Optimized from ${formatBytes(image.originalSize)} to ${formatBytes(image.optimizedSize)}.`);
    } catch (err) {
      setMessage('');
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function handleRemove() {
    setMessage('');
    setError('');
    onRemove();
  }

  return (
    <div className="image-picker">
      <ImageBox url={shownUrl} alt="Product photo" key={shownUrl ?? 'none'} />

      <div className="image-picker-controls">
        <span className="field-label">
          Photo <span className="muted">(optional)</span>
        </span>

        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={handleFile} />

        <div className="image-picker-buttons">
          <button type="button" className="btn btn-secondary btn-small" onClick={() => inputRef.current?.click()} disabled={busy}>
            <ImagePlus size={14} /> {shownUrl ? 'Change photo' : 'Upload photo'}
          </button>
          {shownUrl && (
            <button type="button" className="btn btn-ghost-danger btn-small" onClick={handleRemove} disabled={busy}>
              <Trash2 size={14} /> Remove
            </button>
          )}
        </div>

        {message && <p className="small muted">{message}</p>}
        {error && <p className="small text-negative">{error}</p>}
        <p className="field-hint">
          JPG, PNG or WebP up to {formatBytes(MAX_UPLOAD_BYTES)}. Photos are resized and compressed before uploading.
        </p>
      </div>
    </div>
  );
}
