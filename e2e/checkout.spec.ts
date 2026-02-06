
import { test, expect } from '@playwright/test';

test.describe('Checkout Flow', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('should initialize with Free Plan and £0.00 total', async ({ page }) => {
        await expect(page.locator('#summary-total')).toHaveText('£0.00');
        await expect(page.locator('input[name="tagCapacity"][value="1"]')).toBeChecked();
    });

    test('should update total when selecting tags', async ({ page }) => {
        // Select 3 tags (£0.99)
        await page.click('input[name="tagCapacity"][value="3"]');
        await expect(page.locator('#summary-total')).toHaveText('£0.99');
        await expect(page.locator('#sticky-total')).toHaveText('£0.99');
    });

    test('should calculate complex bundle correctly', async ({ page }) => {
        // Select 20 tags (£3.99)
        await page.click('input[name="tagCapacity"][value="20"]');

        // Select 1 x Return (£3.99)
        await page.click('input[name="returnCredits"][value="1"]');

        // Select 1 x Extra Contact (£0.99)
        await page.click('input[name="extraContacts"][value="1"]');

        // Total: 3.99 + 3.99 + 0.99 = 8.97
        await expect(page.locator('#summary-total')).toHaveText('£8.97');
    });

    test('should have a working checkout button', async ({ page }) => {
        // Setup state
        await page.click('input[name="tagCapacity"][value="3"]');

        // Handle alert
        page.on('dialog', dialog => dialog.accept());

        await page.click('#cta-button');
        // Button should show processing state (check opacity or text)
        await expect(page.locator('#cta-button')).toHaveText(/Processing/);
        await expect(page.locator('#cta-button')).toBeDisabled();
    });
});
