import { ShopDashboardPage } from '../pages/ShopDashboardPage';
import { expect, test } from '../support/fixtures';
import { injectAppSession } from '../support/session';

test.describe('Shop dashboard route', () => {
  test.beforeEach(async ({ context, seededState }) => {
    await injectAppSession(context, seededState.session);
  });

  test('loads the queue table and last five haircut history through the injected app session cookie', async ({ page, seededState }) => {
    const shopDashboardPage = new ShopDashboardPage(page);

    await shopDashboardPage.goto(seededState.shopId);

    await expect(shopDashboardPage.queueTable).toBeVisible();
    await expect(shopDashboardPage.queueRows).toHaveCount(2);
    await expect(shopDashboardPage.last5HaircutsHeading).toBeVisible();
    await expect(shopDashboardPage.last5HaircutCards).toHaveCount(5);
    await expect(shopDashboardPage.last5HaircutsDataset).toContainText('Jordan Booker');
    await expect(shopDashboardPage.last5HaircutsDataset).toContainText('Textured Crop');
  });
});
