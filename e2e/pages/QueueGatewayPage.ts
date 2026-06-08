import type { Locator, Page } from '@playwright/test';

export class QueueGatewayPage {
  readonly page: Page;
  readonly platformIndicator: Locator;
  readonly appleWalletButton: Locator;
  readonly googleWalletButton: Locator;
  readonly passSerialNumber: Locator;
  readonly queuePosition: Locator;
  readonly estimatedWait: Locator;

  constructor(page: Page) {
    this.page = page;
    this.platformIndicator = page.getByTestId('device-platform-indicator');
    this.appleWalletButton = page.getByTestId('apple-wallet-button');
    this.googleWalletButton = page.getByTestId('google-wallet-button');
    this.passSerialNumber = page.getByTestId('pass-serial-number');
    this.queuePosition = page.getByTestId('queue-position');
    this.estimatedWait = page.getByTestId('estimated-wait');
  }

  async goto(ticketId: string) {
    await this.page.goto(`/queue/${ticketId}`);
  }
}
