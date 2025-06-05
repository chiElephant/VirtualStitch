import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe.skip('Accessibility Tests @accessibility', () => {
  test('homepage should not have accessibility violations', async ({
    page,
  }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    if (accessibilityScanResults.violations.length > 0) {
      console.log('Accessibility violations found:');
      accessibilityScanResults.violations.forEach((violation, index) => {
        console.log(
          `\n${index + 1}. ${violation.id}: ${violation.description}`
        );
        console.log(`   Impact: ${violation.impact}`);
        console.log(`   Help: ${violation.help}`);
        console.log(`   Elements affected: ${violation.nodes.length}`);

        violation.nodes.forEach((node, nodeIndex) => {
          console.log(`   ${nodeIndex + 1}. ${node.html.substring(0, 100)}...`);
          if (node.failureSummary) {
            console.log(`      Issue: ${node.failureSummary.split('\n')[0]}`);
          }
        });
      });
    }

    // ✅ Now test all violations (removed the filter)
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('customizer should not have accessibility violations', async ({
    page,
  }) => {
    await page.goto('/');

    await page.click('button[aria-label="Customize It"]');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    if (accessibilityScanResults.violations.length > 0) {
      console.log('Accessibility violations found:');
      accessibilityScanResults.violations.forEach((violation, index) => {
        console.log(
          `\n${index + 1}. ${violation.id}: ${violation.description}`
        );
        console.log(`   Impact: ${violation.impact}`);

        if (violation.id === 'color-contrast') {
          violation.nodes.forEach((node) => {
            const data = node.any[0]?.data;
            if (data) {
              console.log(`   Current contrast: ${data.contrastRatio}`);
              console.log(
                `   Required contrast: ${data.expectedContrastRatio}`
              );
              console.log(`   Colors: ${data.fgColor} on ${data.bgColor}`);
            }
          });
        }
      });
    }

    // ✅ Now test all violations (removed the filter)
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('keyboard navigation works', async ({ page }) => {
    await page.goto('/');

    // Test tab navigation
    await page.keyboard.press('Tab');
    const firstFocusedElement = await page.locator(':focus').textContent();
    expect(firstFocusedElement).toBeTruthy();

    // Test that focus is visible
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // Test Enter key activation on focused button
    await page.keyboard.press('Enter');

    // Add more keyboard navigation tests as needed
  });

  test('check specific color combinations', async ({ page }) => {
    await page.goto('/');

    // Test specific elements for contrast
    const customizeButton = page.locator('button[aria-label="Customize It"]');
    await expect(customizeButton).toBeVisible();

    // Get computed styles
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

    // ✅ The button should now use the accessible green color
    // RGB values for #007938 are rgb(0, 121, 56)
    expect(buttonStyles.backgroundColor).toBe('rgb(0, 121, 56)');
  });
});
