'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useRouter } from 'next/navigation';
import { X, Loader2 } from 'lucide-react';

export default function QRScanner() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const scanner = new Html5Qrcode('reader');
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          if (decodedText.includes('/checkin/')) {
            const token = decodedText.split('/checkin/').pop();
            scanner.stop().catch(() => {});
            router.push(`/checkin/${token}`);
          } else {
            setError('Invalid QR Code. Please scan a YourBarber customer QR.');
          }
        },
        () => {}
      )
      .then(() => setStarting(false))
      .catch(() => {
        setError('Camera access denied. Please allow camera permission and try again.');
        setStarting(false);
      });

    return () => {
      scanner.stop().catch(() => {});
    };
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center p-4">
      {starting && (
        <div className="flex items-center gap-2 text-white/40 text-sm mb-4">
          <Loader2 size={16} className="animate-spin" />
          Starting camera...
        </div>
      )}

      <div
        id="reader"
        className="w-full max-w-md rounded-xl overflow-hidden border border-white/10 bg-black/40"
      />

      {error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
          <X size={16} /> {error}
        </div>
      )}

      <p className="mt-6 text-white/40 text-center text-sm font-inter">
        Align the customer&apos;s QR code within the frame to automatically load their profile.
      </p>
    </div>
  );
}
