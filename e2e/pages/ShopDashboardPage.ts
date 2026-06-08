import type { Locator, Page } from '@playwright/test';

export class ShopDashboardPage {
  readonly page: Page;
  readonly queueTable: Locator;
  readonly queueRows: Locator;
  readonly last5HaircutsHeading: Locator;
  readonly last5HaircutCards: Locator;
  readonly last5HaircutsDataset: Locator;

  constructor(page: Page) {
    this.page = page;
    this.queueTable = page.getByTestId('shop-queue-table');
    this.queueRows = page.getByTestId('queue-table-row');
    this.last5HaircutsHeading = page.getByRole('heading', { name: /last 5 haircuts/i });
    this.last5HaircutCards = page.getByTestId('haircut-history-card');
    this.last5HaircutsDataset = page.getByTestId('last-5-haircuts-dataset');
  }

  async goto(shopId: string) {
    await this.page.goto(`/dashboard/shop/${shopId}`);
  }
}
