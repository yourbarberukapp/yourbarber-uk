'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';

export default function QRScanner() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    scannerRef.current = new Html5QrcodeScanner(
      'reader',
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    scannerRef.current.render(onScanSuccess, onScanFailure);

    function onScanSuccess(decodedText: string) {
      // The decoded text is expected to be a URL: https://yourbarber.uk/checkin/[token]
      // We want to extract the token or just redirect to the checkin page
      try {
        if (decodedText.includes('/checkin/')) {
          const parts = decodedText.split('/checkin/');
          const token = parts[parts.length - 1];
          router.push(`/checkin/${token}`);
          if (scannerRef.current) {
            scannerRef.current.clear();
          }
        } else {
          setError('Invalid QR Code. Please scan a YourBarber customer QR.');
        }
      } catch {
        setError('Failed to process QR code.');
      }
    }

    function onScanFailure(_error: unknown) {
      // Called many times per second while scanning — intentionally ignored
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error('Failed to clear scanner', err));
      }
    };
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div id="reader" className="w-full max-w-md rounded-xl overflow-hidden border border-white/10 bg-black/40"></div>
      
      {error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
          <X size={16} /> {error}
        </div>
      )}
      
      <p className="mt-6 text-white/40 text-center text-sm font-inter">
        Align the customer's QR code within the frame to automatically load their profile.
      </p>
    </div>
  );
}
