import { QueueGatewayPage } from '../pages/QueueGatewayPage';
import { expect, test } from '../support/fixtures';

const IPHONE_USER_AGENT =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1';
const ANDROID_USER_AGENT =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36';

test.describe('Queue pass gateway', () => {
  test('renders Apple and Google wallet actions for an Apple device', async ({ browser, seededState }) => {
    const context = await browser.newContext({
      baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000',
      viewport: { width: 393, height: 852 },
      userAgent: IPHONE_USER_AGENT,
    });
    const page = await context.newPage();
    const gatewayPage = new QueueGatewayPage(page);

    await gatewayPage.goto(seededState.queueTicket.id);

    await expect(gatewayPage.platformIndicator).toContainText(/apple device detected/i);
    await expect(gatewayPage.appleWalletButton).toBeVisible();
    await expect(gatewayPage.googleWalletButton).toBeVisible();
    await expect(gatewayPage.passSerialNumber).toContainText(seededState.queueTicket.passSerialNumber);
    await expect(gatewayPage.queuePosition).toHaveText(String(seededState.queueTicket.position));
    await expect(gatewayPage.estimatedWait).toContainText(`${seededState.queueTicket.estimatedWaitMinutes}m`);

    await context.close();
  });

  test('renders Android platform detection without hiding either wallet action', async ({ browser, seededState }) => {
    const context = await browser.newContext({
      baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000',
      viewport: { width: 412, height: 915 },
      userAgent: ANDROID_USER_AGENT,
    });
    const page = await context.newPage();
    const gatewayPage = new QueueGatewayPage(page);

    await gatewayPage.goto(seededState.queueTicket.id);

    await expect(gatewayPage.platformIndicator).toContainText(/android device detected/i);
    await expect(gatewayPage.appleWalletButton).toBeVisible();
    await expect(gatewayPage.googleWalletButton).toBeVisible();

    await context.close();
  });
});
