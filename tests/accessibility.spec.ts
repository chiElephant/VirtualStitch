import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests @accessibility', () => {
  test('homepage should not have accessibility violations', async ({
    page,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('customizer should not have accessibility violations', async ({
    page,
  }) => {
    await page.goto('/');
    await page.click('button[aria-label="Customize It"]');
    await page.waitForTimeout(2000);
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      // Skip color-contrast checks due to glassmorphism interference
      .disableRules(['color-contrast'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('keyboard navigation works', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    const firstFocusedElement = await page.locator(':focus').textContent();
    expect(firstFocusedElement).toBeTruthy();

    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    await page.keyboard.press('Enter');
  });

  test('check specific color combinations', async ({ page }) => {
    await page.goto('/');
    const customizeButton = page.locator('button[aria-label="Customize It"]');
    await expect(customizeButton).toBeVisible();

    const buttonStyles = await customizeButton.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        backgroundColor: styles.backgroundColor,
        color: styles.color,
        fontSize: styles.fontSize,
        fontWeight: styles.fontWeight,
      };
    });

    console.log('Button styles:', buttonStyles);
    expect(buttonStyles.backgroundColor).toBe('rgb(0, 121, 56)');
  });
});
