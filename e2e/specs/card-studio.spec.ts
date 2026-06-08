import { CardStudioPage } from '../pages/CardStudioPage';
import { expect, test } from '../support/fixtures';
import { injectAppSession } from '../support/session';

test.describe('Card studio customizer', () => {
  test.beforeEach(async ({ context, seededState, page }) => {
    await page.setViewportSize({ width: 1600, height: 1100 });
    await injectAppSession(context, seededState.session);
  });

  test('keeps Apple and Google previews mounted side by side with no copy overflow', async ({ page }) => {
    const studioPage = new CardStudioPage(page);

    await studioPage.goto();

    await expect(studioPage.wizard).toBeVisible();
    await expect(studioPage.previewCanvas).toBeVisible();
    await expect(studioPage.applePreview).toBeVisible();
    await expect(studioPage.googlePreview).toBeVisible();

    const metrics = await studioPage.getLayoutMetrics();
    expect(metrics).not.toBeNull();

    if (!metrics) return;

    expect(metrics.appleRect.right).toBeLessThanOrEqual(metrics.googleRect.left + 8);
    expect(Math.abs(metrics.appleRect.width - metrics.googleRect.width)).toBeLessThanOrEqual(24);
    expect(Math.abs(metrics.appleRect.top - metrics.googleRect.top)).toBeLessThanOrEqual(24);
    expect(metrics.appleOverflow).toBeFalsy();
    expect(metrics.googleOverflow).toBeFalsy();
  });
});
