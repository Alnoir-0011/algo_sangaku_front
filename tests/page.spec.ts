import { test, expect } from '@playwright/test';

test.describe('TopPage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('has title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'アルゴ算額' })).toBeVisible();
  });

  test('has description', async ({ page }) => {
    await expect(
      page.getByText(
        '算額とは、神社や寺院に奉納された和算の絵馬のことで、日本独自に広まった文化だと言われています。難問が多いですが、問題が解けた喜びを神仏に感謝したり、学業成就を祈願する風習として親しまれてきました。',
        { exact: true }
      )
    ).toBeVisible();
  })

  test('has link to createSangaku page', async ({ page }) => {
    const link = page.getByRole('link', { name: '算額を作る' });
    await expect(link).toBeVisible();
  });

  test('has link to showSangakus page', async ({ page }) => {
    const link = page.getByRole('link', { name: '算額を確認' });
    await expect(link).toBeVisible();
  });

  test('has link to map page', async ({ page }) => {
    const link = page.getByRole('link', { name: '神社を探す' });
    await expect(link).toBeVisible();
  });

  test('has link to answerSangaku page', async ({ page }) => {
    const link = page.getByRole('link', { name: '算額を解く' });
    await expect(link).toBeVisible();
  });
});

