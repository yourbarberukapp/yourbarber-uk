'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Scissors } from 'lucide-react';
import { Suspense } from 'react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const preCode = searchParams.get('code') ?? '';
    if (preCode) setCode(preCode.toUpperCase().slice(0, 5));
    inputRef.current?.focus();
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 5) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/customer/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      if (res.ok) {
        router.push('/customer');
      } else {
        setError("We don't recognise that code. Check your SMS and try again.");
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#C8F135]/10 mb-5">
            <Scissors size={24} className="text-[#C8F135]" />
          </div>
          <h1 className="font-barlow font-black text-3xl uppercase tracking-tight text-white">
            Your<span className="text-[#C8F135]">Barber</span>
          </h1>
          <p className="text-white/40 text-sm font-inter mt-2">
            Enter your personal code from the SMS
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              ref={inputRef}
              type="text"
              value={code}
              onChange={(e) => {
                setError('');
                setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5));
              }}
              placeholder="A B C 1 2"
              maxLength={5}
              className="w-full bg-[#141414] border border-white/10 rounded-sm px-4 py-4 text-white text-center text-3xl font-barlow font-bold tracking-[0.5em] placeholder-white/15 focus:outline-none focus:border-[#C8F135]/40 focus:ring-1 focus:ring-[#C8F135]/20 transition-colors uppercase"
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
            />
            {error && (
              <p className="text-red-400 text-xs font-inter mt-2 text-center">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={code.length !== 5 || loading}
            className="btn-lime w-full py-3.5 text-base rounded-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
          >
            {loading ? 'Checking…' : 'View my cut'}
          </button>
        </form>

        <p className="text-white/25 text-xs font-inter text-center mt-8">
          Your code is in every reminder SMS from your barber.
        </p>
      </div>
    </div>
  );
}

export default function CustomerLogin() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
