'use client';

/**
 * PhotoCapture Component
 * Handles file upload and camera access for 4-angle haircut photos
 * Refined for premium dark aesthetic with Electric Lime accents.
 */
import { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, Check, Loader2 } from 'lucide-react';

const ANGLES = ['front', 'back', 'left', 'right'] as const;
type Angle = typeof ANGLES[number];

export interface CapturedPhoto {
  angle: Angle;
  file?: File;
  preview: string;
}

interface PhotoCaptureProps {
  visitId: string;
  onDone: () => void;
}

export function PhotoCapture({ visitId, onDone }: PhotoCaptureProps) {
  const [photos, setPhotos] = useState<Partial<Record<Angle, CapturedPhoto>>>({});
  const [activeAngle, setActiveAngle] = useState<Angle | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Clean up URL object previews on unmount
  useEffect(() => {
    return () => {
      Object.values(photos).forEach(p => {
        if (p?.preview.startsWith('blob:')) {
          URL.revokeObjectURL(p.preview);
        }
      });
    };
  }, [photos]);

  const startCamera = async (angle: Angle) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
        setActiveAngle(angle);
      }
    } catch (error) {
      console.error('Camera access denied:', error);
      setUploadError('Camera access denied. Use file upload instead.');
      // Fallback to file input
      setTimeout(() => setUploadError(''), 3000);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !activeAngle) return;

    const context = canvasRef.current.getContext('2d');
    if (!context) return;

    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0);

    canvasRef.current.toBlob((blob) => {
      if (!blob || !activeAngle) return;

      const file = new File([blob], `haircut-${activeAngle}.jpg`, { type: 'image/jpeg' });
      const preview = URL.createObjectURL(blob);

      setPhotos(prev => ({
        ...prev,
        [activeAngle]: { angle: activeAngle, file, preview }
      }));

      stopCamera();
    }, 'image/jpeg');
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
    }
    setCameraActive(false);
    setActiveAngle(null);
  };

  const handleFileUpload = (angle: Angle, file: File) => {
    const preview = URL.createObjectURL(file);
    setPhotos(prev => ({
      ...prev,
      [angle]: { angle, file, preview }
    }));
  };

  const removePhoto = (angle: Angle) => {
    setPhotos(prev => {
      const next = { ...prev };
      if (next[angle]?.preview.startsWith('blob:')) {
        URL.revokeObjectURL(next[angle]!.preview);
      }
      delete next[angle];
      return next;
    });
  };

  async function handleUpload() {
    const captured = ANGLES.flatMap(a => photos[a] ? [photos[a]!] : []);
    if (captured.length === 0) {
      onDone();
      return;
    }

    setUploading(true);
    setUploadError('');
    try {
      const res = await fetch(`/api/visits/${visitId}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photos: captured.map(p => ({
            angle: p.angle,
            contentType: p.file?.type || 'image/jpeg',
          })),
        }),
      });

      if (!res.ok) throw new Error('Failed to get upload URLs');
      const urls: { angle: Angle; uploadUrl: string }[] = await res.json();

      await Promise.all(
        urls.map(({ angle, uploadUrl }) => {
          const photo = photos[angle]!;
          if (!photo.file) return Promise.resolve();
          return fetch(uploadUrl, {
            method: 'PUT',
            body: photo.file,
            headers: { 'Content-Type': photo.file.type || 'image/jpeg' },
          });
        })
      );
      onDone();
    } catch (err) {
      console.error('Upload error:', err);
      setUploadError('Upload failed. Tap "Skip" to continue anyway.');
      setUploading(false);
    }
  }

  const capturedCount = Object.keys(photos).length;

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold mb-4 text-white/40 uppercase tracking-wider font-barlow">
          Haircut Photos (4 angles)
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {ANGLES.map((angle) => {
            const photo = photos[angle];
            return (
              <div key={angle} className="relative group">
                {photo?.preview ? (
                  <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-[#C8F135] shadow-[0_0_15px_rgba(200,241,53,0.2)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.preview}
                      alt={angle}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => removePhoto(angle)}
                      className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-red-500 text-white p-1.5 rounded-full transition-colors z-10"
                    >
                      <X size={14} />
                    </button>
                    <div className="absolute bottom-1.5 right-1.5 bg-[#C8F135] text-[#0A0A0A] p-1 rounded-full">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  </div>
                ) : (
                  <div className="aspect-square bg-[#111] border-2 border-white/5 rounded-lg flex flex-col items-center justify-center hover:border-[#C8F135]/30 transition-all duration-300 relative overflow-hidden">
                    <div className="text-center space-y-1.5 z-0">
                      <Camera size={20} className="mx-auto text-white/20 group-hover:text-white/40 transition-colors" />
                      <p className="text-[10px] text-white/20 capitalize font-bold tracking-widest group-hover:text-white/40 transition-colors font-barlow">{angle}</p>
                    </div>

                    {/* Hidden file input */}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleFileUpload(angle, e.target.files[0]);
                        }
                      }}
                      className="hidden"
                      id={`file-${angle}`}
                    />

                    {/* Buttons overlay on hover */}
                    <div className="absolute inset-0 bg-[#0A0A0A]/80 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-lg flex flex-col items-center justify-center gap-2 p-2">
                      <button
                        onClick={() => startCamera(angle)}
                        className="w-full bg-[#C8F135] text-[#0A0A0A] py-1.5 rounded text-[10px] font-bold uppercase flex items-center justify-center gap-1.5 hover:bg-[#d4ff3f] transition-colors"
                      >
                        <Camera size={12} />
                        Camera
                      </button>
                      <button
                        onClick={() => document.getElementById(`file-${angle}`)?.click()}
                        className="w-full bg-white/10 text-white py-1.5 rounded text-[10px] font-bold uppercase flex items-center justify-center gap-1.5 hover:bg-white/20 transition-colors border border-white/10"
                      >
                        <Upload size={12} />
                        Upload
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {uploadError && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-xs font-medium">
          {uploadError}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          onClick={onDone}
          disabled={uploading}
          className="flex-1 px-4 py-3 border border-white/10 rounded-sm text-white/40 text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-colors disabled:opacity-50 font-barlow"
        >
          Skip photos
        </button>
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="flex-1 btn-lime px-4 py-3 rounded-sm text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {uploading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Saving...
            </>
          ) : (
            <>
              {capturedCount > 0 ? `Save ${capturedCount} photo${capturedCount > 1 ? 's' : ''}` : 'Done'}
              <Check size={14} />
            </>
          )}
        </button>
      </div>

      {/* Camera Modal */}
      {cameraActive && activeAngle && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[100] p-4">
          <div className="bg-[#111] rounded-lg overflow-hidden max-w-xl w-full border border-white/10 shadow-2xl">
            <div className="relative bg-black aspect-video sm:aspect-[4/3]">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Guides */}
              <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none flex items-center justify-center">
                 <div className="w-full h-full border border-white/20 rounded-lg" />
              </div>

              <button 
                onClick={stopCamera}
                className="absolute top-4 right-4 bg-black/60 text-white p-2 rounded-full hover:bg-black/80 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="text-center">
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-1 font-barlow">Positioning</p>
                <h3 className="text-xl font-barlow font-bold text-white capitalize tracking-wide">{activeAngle} View</h3>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={capturePhoto}
                  className="flex-[2] bg-[#C8F135] text-[#0A0A0A] px-6 py-4 rounded-sm font-black uppercase tracking-widest hover:bg-[#d4ff3f] transition-all flex items-center justify-center gap-2 text-sm shadow-[0_0_20px_rgba(200,241,53,0.3)]"
                >
                  <Camera size={20} />
                  Capture Photo
                </button>
                <button
                  onClick={stopCamera}
                  className="flex-1 bg-white/5 text-white/60 px-4 py-4 rounded-sm font-bold uppercase tracking-widest hover:bg-white/10 transition-colors border border-white/10 text-xs font-barlow"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

