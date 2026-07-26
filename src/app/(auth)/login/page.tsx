import { redirect } from 'next/navigation';

// Only forward callbackUrl if it's a same-origin relative path — a bare
// "/dashboard"-style value, never an absolute URL or protocol-relative
// "//evil.com" (which browsers treat as absolute). Anything else is an
// open-redirect vector: a crafted /login?callbackUrl=https://evil.com link
// would show the real login page, then bounce a successfully authenticated
// owner straight to an attacker's site after they enter their passcode.
function isSafeCallbackPath(value: string): boolean {
  return value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\');
}

export default function LoginRedirect({
  searchParams,
}: {
  searchParams: { callbackUrl?: string };
}) {
  const callbackUrl = searchParams.callbackUrl;
  const safeCallback = callbackUrl && isSafeCallbackPath(callbackUrl) ? callbackUrl : null;
  redirect(safeCallback ? `/owner/login?callbackUrl=${encodeURIComponent(safeCallback)}` : '/owner/login');
}
