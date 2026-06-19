import { test, expect } from '@/tests/fixtures.ct';
import Header from '@/app/ui/navigation/Header';

test.describe('header', () => {
  test.describe('desktop', () => {
    test.use({ viewport: { width: 1280, height: 720 } });

    test('should allow me to see header icon', async ({ mount }) => {
      const component = await mount(<Header drawerWidth={240} handleDrawerToggle={() => { }} />);
      const IconImg = component.getByAltText('Icon image');
      await expect(IconImg).toBeVisible();
    });

    test('should not allow me to see hamburger menu button on desktop', async ({ mount }) => {
      const component = await mount(<Header drawerWidth={240} handleDrawerToggle={() => { }} />);
      const button = component.getByRole("button");
      await expect(button).not.toBeVisible();
    });
  });

  test.describe('mobile', () => {
    test.use({ viewport: { width: 599, height: 720 } });

    test('should allow me to see header icon', async ({ mount }) => {
      const component = await mount(<Header drawerWidth={240} handleDrawerToggle={() => { }} />);
      const IconImg = component.getByAltText('Icon image');
      await expect(IconImg).toBeVisible();
    });

    test('should allow me to see hamburger menu button on mobile', async ({ mount }) => {
      const component = await mount(<Header drawerWidth={240} handleDrawerToggle={() => { }} />);
      const button = component.getByRole("button");
      await expect(button).toBeVisible();
    });
  });
});
