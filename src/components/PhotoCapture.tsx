'use client';

/**
 * PhotoCapture Component
 * Handles file upload and camera access for 4-angle haircut photos.
 * Updated for smooth automated sequence with head shape overlay and camera switching.
 */
import { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, Check, Loader2, RefreshCw, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ANGLES = ['back', 'left', 'right', 'front'] as const;
type Angle = typeof ANGLES[number];

function applyWatermark(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, shopName?: string) {
  const { width, height } = canvas;
  const fontSize = Math.max(14, Math.round(width * 0.036));
  const subFontSize = Math.max(11, Math.round(width * 0.026));
  const padding = Math.round(fontSize * 0.5);
  const brand = 'YOURBARBER';

  ctx.textBaseline = 'bottom';
  ctx.font = `900 ${fontSize}px 'Arial Black', 'Impact', sans-serif`;
  const brandWidth = ctx.measureText(brand).width;

  ctx.font = `700 ${subFontSize}px 'Arial Narrow', 'Arial', sans-serif`;
  const subWidth = shopName ? ctx.measureText(shopName.toUpperCase()).width : 0;

  const blockW = Math.max(brandWidth, subWidth) + padding * 2;
  const blockH = fontSize + (shopName ? subFontSize + 3 : 0) + padding * 1.5;
  const bx = width - blockW - padding;
  const by = height - padding;

  // Dark background pill
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(bx - padding * 0.5, by - blockH, blockW + padding, blockH + padding * 0.5);

  // YOURBARBER in lime
  ctx.font = `900 ${fontSize}px 'Arial Black', 'Impact', sans-serif`;
  ctx.fillStyle = 'rgba(200,241,53,0.95)';
  ctx.fillText(brand, bx, by - (shopName ? subFontSize + 3 : 0));

  // Shop name in white below
  if (shopName) {
    ctx.font = `700 ${subFontSize}px 'Arial Narrow', 'Arial', sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText(shopName.toUpperCase(), bx, by);
  }
}

async function watermarkFile(file: File, shopName?: string): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const blobUrl = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      applyWatermark(canvas, ctx, shopName);
      URL.revokeObjectURL(blobUrl);
      canvas.toBlob(
        (blob) => resolve(new File([blob!], file.name, { type: 'image/jpeg' })),
        'image/jpeg',
        0.92
      );
    };
    img.src = blobUrl;
  });
}

function HeadOverlay({ angle }: { angle: Angle }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <svg
        viewBox="0 0 200 200"
        className="w-[70%] h-[70%] text-white/20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Head Shape */}
        <path d="M100 30 C 65 30, 45 60, 45 100 C 45 140, 65 170, 100 170 C 135 170, 155 140, 155 100 C 155 60, 135 30, 100 30 Z" />
        
        {/* Ears (Contextual) */}
        <path d="M45 90 Q 35 90, 40 110" />
        <path d="M155 90 Q 165 90, 160 110" />
        
        {/* Shoulders */}
        <path d="M20 190 Q 50 160, 100 160 Q 150 160, 180 190" />

        {/* Directional Indicator */}
        <g className="text-[#C8F135]/40" strokeWidth="2">
          {angle === 'front' && (
             <path d="M85 85 L100 70 L115 85 M100 70 L100 130 M85 115 L100 130 L115 115" opacity="0.3" />
          )}
          {angle === 'back' && (
             <path d="M100 80 L100 120 M80 100 L120 100" opacity="0.2" />
          )}
        </g>
      </svg>
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/40 font-barlow font-black uppercase tracking-[0.3em] text-[10px]">
        Align Head Here
      </div>
    </div>
  );
}

export interface CapturedPhoto {
  angle: Angle;
  file?: File;
  preview: string;
}

interface PhotoCaptureProps {
  visitId: string;
  onDone: () => void;
  shopName?: string;
}

export function PhotoCapture({ visitId, onDone, shopName }: PhotoCaptureProps) {
  const [photos, setPhotos] = useState<Partial<Record<Angle, CapturedPhoto>>>({});
  const [activeAngle, setActiveAngle] = useState<Angle | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      Object.values(photos).forEach(p => {
        if (p?.preview.startsWith('blob:')) {
          URL.revokeObjectURL(p.preview);
        }
      });
    };
  }, [photos]);

  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraActive]);

  const startCamera = async (angle: Angle) => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facingMode } },
      });
      streamRef.current = stream;
      setActiveAngle(angle);
      setCameraActive(true);
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (error) {
      console.error('Camera access denied:', error);
      setUploadError('Camera access denied. Use file upload instead.');
      setTimeout(() => setUploadError(''), 3000);
    }
  };

  const toggleFacingMode = () => {
    const next = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(next);
    if (activeAngle) startCamera(activeAngle);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !activeAngle) return;

    const context = canvasRef.current.getContext('2d');
    if (!context) return;

    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0);
    applyWatermark(canvasRef.current, context, shopName);

    canvasRef.current.toBlob((blob) => {
      if (!blob || !activeAngle) return;

      const file = new File([blob], `haircut-${activeAngle}.jpg`, { type: 'image/jpeg' });
      const preview = URL.createObjectURL(blob);

      setPhotos(prev => ({
        ...prev,
        [activeAngle]: { angle: activeAngle, file, preview }
      }));

      // Auto-sequence to next angle
      const currentIndex = ANGLES.indexOf(activeAngle);
      if (currentIndex < ANGLES.length - 1) {
        setActiveAngle(ANGLES[currentIndex + 1]);
      } else {
        stopCamera();
      }
    }, 'image/jpeg');
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setActiveAngle(null);
  };

  const handleFileUpload = async (angle: Angle, file: File) => {
    const marked = await watermarkFile(file, shopName);
    const preview = URL.createObjectURL(marked);
    setPhotos(prev => ({
      ...prev,
      [angle]: { angle, file: marked, preview }
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
        <div className="flex items-center justify-between mb-4">
          <label className="block text-xs font-black text-white/40 uppercase tracking-[0.2em] font-barlow">
            Haircut Records
          </label>
          <button 
            onClick={() => startCamera(ANGLES[0])}
            className="text-[10px] font-black uppercase tracking-widest text-[#C8F135] flex items-center gap-2 hover:bg-[#C8F135]/10 px-3 py-1.5 rounded-full transition-colors"
          >
            <Smartphone size={14} /> Start Sequence
          </button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {ANGLES.map((angle) => {
            const photo = photos[angle];
            return (
              <div key={angle} className="relative group">
                {photo?.preview ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative aspect-square rounded-2xl overflow-hidden border-2 border-[#C8F135] shadow-[0_0_20px_rgba(200,241,53,0.15)]"
                  >
                    <img
                      src={photo.preview}
                      alt={angle}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => removePhoto(angle)}
                      className="absolute top-2 right-2 bg-black/60 hover:bg-red-500 text-white p-2 rounded-full transition-colors z-10"
                    >
                      <X size={14} />
                    </button>
                    <div className="absolute bottom-2 left-2 bg-[#C8F135] text-[#0A0A0A] px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter">
                      {angle}
                    </div>
                  </motion.div>
                ) : (
                  <div className="aspect-square bg-[#111] border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center hover:border-[#C8F135]/30 transition-all duration-300 relative group cursor-pointer"
                    onClick={() => startCamera(angle)}
                  >
                    <Camera size={24} className="text-white/10 group-hover:text-[#C8F135]/40 transition-colors" />
                    <p className="text-[10px] text-white/10 capitalize font-black tracking-widest mt-2 group-hover:text-white/40 transition-colors font-barlow">{angle}</p>
                    
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleFileUpload(angle, e.target.files[0]);
                      }}
                      className="hidden"
                      id={`file-${angle}`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {uploadError && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold font-inter text-center">
          {uploadError}
        </div>
      )}

      <div className="flex gap-4 pt-4">
        <button
          onClick={onDone}
          disabled={uploading}
          className="flex-1 px-6 py-4 bg-white/5 border border-white/5 rounded-2xl text-white/40 text-xs font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-colors disabled:opacity-50 font-barlow"
        >
          Skip
        </button>
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="flex-1 bg-[#C8F135] text-black px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_10px_30px_rgba(200,241,53,0.15)]"
        >
          {uploading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              {capturedCount > 0 ? `Save ${capturedCount} Photos` : 'Finish Visit'}
              <Check size={16} strokeWidth={3} />
            </>
          )}
        </button>
      </div>

      {/* Modern Fullscreen Camera Modal */}
      <AnimatePresence>
        {cameraActive && activeAngle && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-[100] flex flex-col"
          >
            {/* Header */}
            <div className="p-6 flex items-center justify-between z-10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[#C8F135]">
                   <Camera size={20} />
                </div>
                <div>
                  <h3 className="text-white font-barlow font-black text-xl uppercase tracking-tight leading-none">
                    {activeAngle} <span className="text-[#C8F135]">View</span>
                  </h3>
                  <p className="text-white/30 text-[10px] font-black uppercase tracking-widest mt-1">
                    Step {ANGLES.indexOf(activeAngle) + 1} of 4
                  </p>
                </div>
              </div>
              <button 
                onClick={stopCamera}
                className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Viewport */}
            <div className="flex-1 relative bg-[#050505] overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
                style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Head Silhouette Overlay */}
              <HeadOverlay angle={activeAngle} />

              {/* Angle Progress Bar */}
              <div className="absolute top-0 left-0 right-0 h-1 flex gap-1 px-1">
                {ANGLES.map((a, i) => (
                  <div 
                    key={a}
                    className={`h-full flex-1 rounded-full transition-all duration-500 ${
                      ANGLES.indexOf(activeAngle) > i ? 'bg-[#C8F135]' : 
                      activeAngle === a ? 'bg-[#C8F135] animate-pulse' : 'bg-white/10'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Controls */}
            <div className="p-8 pb-12 bg-black flex flex-col items-center gap-8">
              <div className="flex items-center justify-center gap-12 w-full max-w-xs">
                <button 
                  onClick={toggleFacingMode}
                  className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all active:scale-90"
                >
                  <RefreshCw size={24} />
                </button>

                <button
                  onClick={capturePhoto}
                  className="w-24 h-24 rounded-full border-4 border-[#C8F135] p-1 group active:scale-95 transition-transform"
                >
                  <div className="w-full h-full rounded-full bg-[#C8F135] flex items-center justify-center group-hover:scale-95 transition-transform">
                    <div className="w-4 h-4 rounded-full bg-black/20" />
                  </div>
                </button>

                <div className="w-14 h-14" /> {/* Spacer */}
              </div>

              <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.3em] font-barlow">
                Watermark applied automatically
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
