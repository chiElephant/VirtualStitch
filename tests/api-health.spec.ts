import { test, expect } from '@playwright/test';

test.describe.skip('API Health Checks @api-health', () => {
  test('homepage API responds correctly', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
  });

  test('custom logo API endpoint is accessible', async ({ request }) => {
    const response = await request.post('/api/custom-logo', {
      data: { prompt: 'test health check' },
    });

    // We expect either success or rate limiting, not 500 errors
    expect([200, 429].includes(response.status())).toBeTruthy();
  });

  test('static assets load correctly', async ({ page }) => {
    await page.goto('/');

    // Check that essential assets are loading
    const images = await page.locator('img').all();
    for (const img of images.slice(0, 3)) {
      // Check first 3 images
      const src = await img.getAttribute('src');
      if (src && !src.startsWith('data:')) {
        const response = await page.request.get(src);
        expect(response.status()).toBe(200);
      }
    }
  });
});
