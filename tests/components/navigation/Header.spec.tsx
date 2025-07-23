import { test, expect } from '@playwright/experimental-ct-react';
import Header from '@/app/ui/navigation/Header';

test.describe('header', () => {
  test.describe('desktop', () => {
    test.use({ viewport: { width: 1280, height: 720 } });

    test('has Icon', async ({ mount }) => {
      const component = await mount(<Header drawerWidth={240} handleDrawerToggle={() => { }} />);
      const IconImg = component.getByAltText('Icon image');
      await expect(IconImg).toBeVisible();
    });

    test('has not hamberger-menu-button', async ({ mount }) => {
      const component = await mount(<Header drawerWidth={240} handleDrawerToggle={() => { }} />);
      const button = component.getByRole("button");
      await expect(button).not.toBeVisible();
    });
  });

  test.describe('mobile', () => {
    test.use({ viewport: { width: 599, height: 720 } });

    test('has Icon', async ({ mount }) => {
      const component = await mount(<Header drawerWidth={240} handleDrawerToggle={() => { }} />);
      const IconImg = component.getByAltText('Icon image');
      await expect(IconImg).toBeVisible();
    });

    test('has not hamberger-menu-button', async ({ mount }) => {
      const component = await mount(<Header drawerWidth={240} handleDrawerToggle={() => { }} />);
      const button = component.getByRole("button");
      await expect(button).toBeVisible();
    });
  })
})

