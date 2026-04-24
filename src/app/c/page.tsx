import { redirect } from 'next/navigation';

export default async function ShortLink({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  if (code) {
    redirect(`/customer/login?code=${code.toUpperCase()}`);
  }
  redirect('/customer/login');
}
