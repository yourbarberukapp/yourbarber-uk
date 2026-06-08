import type { BrowserContext } from '@playwright/test';
import type { AppSession } from '../../src/lib/session';
import { encodePlaywrightSession } from '../../src/lib/e2e/sessionToken';

export async function injectAppSession(
  context: BrowserContext,
  session: AppSession,
  baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000'
) {
  await context.addCookies([
    {
      name: 'app_session_id',
      value: encodePlaywrightSession(session),
      url: baseURL,
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);
}
