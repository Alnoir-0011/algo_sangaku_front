import { test, expect } from '@playwright/experimental-ct-react';
import Header from '@/app/ui/navigation/Header';

test.describe('header', () => {
  test.describe('desktop', () => {
    test.use({ viewport: { width: 1280, height: 720 } });

    test('has Logo', async ({ mount }) => {
      const component = await mount(<Header />);
      const LogoImg = component.getByAltText('Logo image');
      expect(LogoImg).toBeVisible();
    });

    test('has not hamberger-menu-button', async ({ mount }) => {
      const component = await mount(<Header />);
      const button = component.getByRole("button");
      expect(button).not.toBeVisible();
    });
  });

  test.describe('mobile', () => {
    test.use({ viewport: { width: 599, height: 720 } });

    test('has Logo', async ({ mount }) => {
      const component = await mount(<Header />);
      const LogoImg = component.getByAltText('Logo image');
      expect(LogoImg).toBeVisible();
    });

    test('has not hamberger-menu-button', async ({ mount }) => {
      const component = await mount(<Header />);
      const button = component.getByRole("button");
      expect(button).toBeVisible();
    });
  })
})

