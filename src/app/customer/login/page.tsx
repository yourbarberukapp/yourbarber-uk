import { redirect } from 'next/navigation';

export default async function LegacyCustomerLoginRedirect({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  redirect(code ? `/me/login?code=${encodeURIComponent(code)}` : '/me/login');
}
