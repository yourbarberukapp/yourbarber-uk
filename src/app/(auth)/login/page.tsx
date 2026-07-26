import { redirect } from 'next/navigation';

export default function LoginRedirect({
  searchParams,
}: {
  searchParams: { callbackUrl?: string };
}) {
  const callbackUrl = searchParams.callbackUrl;
  redirect(callbackUrl ? `/owner/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : '/owner/login');
}
