import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Cuts — YourBarber',
  description: 'Your personal cut history',
};

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: 'white' }}>
      {children}
    </div>
  );
}
