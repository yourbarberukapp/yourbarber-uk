import type { Locator, Page } from '@playwright/test';

export class LandingPage {
  readonly page: Page;
  readonly heroHeading: Locator;
  readonly primaryCta: Locator;
  readonly joinQueueCallout: Locator;
  readonly featuresLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heroHeading = page.getByRole('heading', { name: /know every client before they sit down/i });
    this.primaryCta = page.getByRole('button', { name: /apply for free beta access/i }).first();
    this.joinQueueCallout = page.getByText(/join the queue/i).first();
    this.featuresLink = page.getByRole('link', { name: /features/i }).first();
  }

  async goto() {
    await this.page.goto('/');
  }
}
