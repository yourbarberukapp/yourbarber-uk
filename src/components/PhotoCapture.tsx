'use client';
import { useRef, useState } from 'react';

const ANGLES = ['front', 'back', 'left', 'right'] as const;
type Angle = typeof ANGLES[number];

interface CapturedPhoto { angle: Angle; file: File; preview: string; }

interface Props {
  visitId: string;
  onDone: () => void;
}

export function PhotoCapture({ visitId, onDone }: Props) {
  const [photos, setPhotos] = useState<Partial<Record<Angle, CapturedPhoto>>>({});
  const [currentAngle, setCurrentAngle] = useState<Angle>('front');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function handleCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setPhotos(prev => ({ ...prev, [currentAngle]: { angle: currentAngle, file, preview } }));
    // Auto-advance to next empty angle
    const captured = { ...photos, [currentAngle]: true };
    const next = ANGLES.find(a => !captured[a]);
    if (next) setCurrentAngle(next);
    // Reset input so same angle can be re-shot
    e.target.value = '';
  }

  async function handleUpload() {
    const captured = ANGLES.flatMap(a => photos[a] ? [photos[a]!] : []);
    if (captured.length === 0) { onDone(); return; }

    setUploading(true); setUploadError('');
    try {
      const res = await fetch(`/api/visits/${visitId}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photos: captured.map(p => ({
            angle: p.angle,
            contentType: p.file.type || 'image/jpeg',
          })),
        }),
      });

      if (!res.ok) throw new Error('Failed to get upload URLs');
      const urls: { angle: Angle; uploadUrl: string }[] = await res.json();

      await Promise.all(
        urls.map(({ angle, uploadUrl }) => {
          const photo = photos[angle]!;
          return fetch(uploadUrl, {
            method: 'PUT',
            body: photo.file,
            headers: { 'Content-Type': photo.file.type || 'image/jpeg' },
          });
        })
      );
      onDone();
    } catch {
      setUploadError('Upload failed. Tap "Skip" to continue anyway.');
      setUploading(false);
    }
  }

  const capturedCount = ANGLES.filter(a => photos[a]).length;

  return (
    <div className="space-y-4">
      <p className="text-sm text-neutral-500">Take up to 4 photos (optional)</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleCapture}
      />
      <div className="grid grid-cols-2 gap-3">
        {ANGLES.map(angle => {
          const captured = photos[angle];
          const isSelected = currentAngle === angle && !captured;
          return (
            <button
              key={angle}
              type="button"
              onClick={() => { setCurrentAngle(angle); inputRef.current?.click(); }}
              className={`relative border-2 rounded-xl aspect-square flex flex-col items-center justify-center overflow-hidden transition-colors ${
                isSelected ? 'border-black bg-neutral-50' : captured ? 'border-green-400' : 'border-neutral-200 bg-neutral-50'
              }`}
            >
              {captured ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={captured.preview} alt={angle} className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <>
                  <span className="text-3xl">📷</span>
                  <span className="text-xs text-neutral-500 capitalize mt-1">{angle}</span>
                </>
              )}
            </button>
          );
        })}
      </div>

      {uploadError && <p className="text-red-600 text-sm">{uploadError}</p>}

      <div className="flex gap-3">
        <button onClick={onDone} disabled={uploading}
          className="flex-1 h-12 border-2 border-neutral-200 rounded-xl text-sm text-neutral-600">
          Skip photos
        </button>
        <button onClick={handleUpload} disabled={uploading}
          className="flex-1 h-12 bg-black text-white rounded-xl text-sm font-medium disabled:opacity-50">
          {uploading ? 'Uploading…' : capturedCount > 0 ? `Save ${capturedCount} photo${capturedCount > 1 ? 's' : ''}` : 'Done'}
        </button>
      </div>
    </div>
  );
}
