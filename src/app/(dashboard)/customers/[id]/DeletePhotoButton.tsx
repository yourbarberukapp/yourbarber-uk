'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';

interface Props {
  visitId: string;
  photoId: string;
}

export function DeletePhotoButton({ visitId, photoId }: Props) {
  const [deleted, setDeleted] = useState(false);
  const [busy, setBusy] = useState(false);

  if (deleted) return null;

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Delete this photo? This cannot be undone.')) return;
    setBusy(true);
    const res = await fetch(`/api/visits/${visitId}/photos/${photoId}`, { method: 'DELETE' });
    if (res.ok) {
      setDeleted(true);
    } else {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={busy}
      title="Delete photo"
      style={{
        position: 'absolute', top: 4, right: 4, zIndex: 10,
        background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: 3,
        padding: '0.25rem', cursor: 'pointer', color: 'rgba(255,80,80,0.8)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: busy ? 0.5 : 1,
      }}
    >
      <Trash2 size={12} />
    </button>
  );
}
