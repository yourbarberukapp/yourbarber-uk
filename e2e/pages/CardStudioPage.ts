import type { Locator, Page } from '@playwright/test';

export class CardStudioPage {
  readonly page: Page;
  readonly wizard: Locator;
  readonly previewCanvas: Locator;
  readonly applePreview: Locator;
  readonly googlePreview: Locator;
  readonly appleCopy: Locator;
  readonly googleCopy: Locator;

  constructor(page: Page) {
    this.page = page;
    this.wizard = page.getByTestId('flipside-wizard');
    this.previewCanvas = page.getByTestId('studio-preview-canvas');
    this.applePreview = page.getByTestId('apple-wallet-preview');
    this.googlePreview = page.getByTestId('google-wallet-preview');
    this.appleCopy = page.getByTestId('apple-wallet-preview-copy');
    this.googleCopy = page.getByTestId('google-wallet-preview-copy');
  }

  async goto() {
    await this.page.goto('/dashboard/studio');
  }

  async getLayoutMetrics() {
    return this.page.evaluate(() => {
      const apple = document.querySelector('[data-testid="apple-wallet-preview"]') as HTMLElement | null;
      const google = document.querySelector('[data-testid="google-wallet-preview"]') as HTMLElement | null;
      const appleCopy = document.querySelector('[data-testid="apple-wallet-preview-copy"]') as HTMLElement | null;
      const googleCopy = document.querySelector('[data-testid="google-wallet-preview-copy"]') as HTMLElement | null;

      if (!apple || !google || !appleCopy || !googleCopy) {
        return null;
      }

      const appleRect = apple.getBoundingClientRect();
      const googleRect = google.getBoundingClientRect();

      return {
        appleRect: {
          top: appleRect.top,
          left: appleRect.left,
          right: appleRect.right,
          width: appleRect.width,
        },
        googleRect: {
          top: googleRect.top,
          left: googleRect.left,
          right: googleRect.right,
          width: googleRect.width,
        },
        appleOverflow: appleCopy.scrollHeight > appleCopy.clientHeight || appleCopy.scrollWidth > appleCopy.clientWidth,
        googleOverflow: googleCopy.scrollHeight > googleCopy.clientHeight || googleCopy.scrollWidth > googleCopy.clientWidth,
      };
    });
  }
}
