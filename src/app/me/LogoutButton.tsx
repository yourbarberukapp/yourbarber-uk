'use client';

import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch('/api/me/logout', { method: 'POST' });
    router.push('/me/login');
  }

  return (
    <button
      onClick={logout}
      style={{
        background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 8, padding: '0.4rem 0.875rem', cursor: 'pointer',
        color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem',
        fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.08em',
      }}
    >
      Sign out
    </button>
  );
}
