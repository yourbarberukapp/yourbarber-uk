import { LandingPage } from '../pages/LandingPage';
import { expect, test } from '../support/fixtures';

test.describe('Public landing page', () => {
  test('renders the hero CTA and queue entry point on desktop', async ({ page }) => {
    const landingPage = new LandingPage(page);

    await page.setViewportSize({ width: 1440, height: 960 });
    await landingPage.goto();

    await expect(landingPage.heroHeading).toBeVisible();
    await expect(landingPage.primaryCta).toBeVisible();
    await expect(landingPage.joinQueueCallout).toBeVisible();
    await expect(landingPage.featuresLink).toBeVisible();
  });

  test('stays responsive on a narrow mobile viewport', async ({ page }) => {
    const landingPage = new LandingPage(page);

    await page.setViewportSize({ width: 390, height: 844 });
    await landingPage.goto();

    await expect(landingPage.heroHeading).toBeVisible();
    await expect(landingPage.primaryCta).toBeVisible();
    await expect(landingPage.joinQueueCallout).toBeVisible();
  });
});
