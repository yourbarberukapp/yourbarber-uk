import CustomerNav from '@/components/customer/CustomerNav';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-20">
      {children}
      <CustomerNav />
    </div>
  );
}
