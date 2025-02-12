import { test, expect } from '@playwright/experimental-ct-react';
import Drawer from '@/app/ui/navigation/Drawer';

test.describe("SideNav", () => {
  test('has AppName', async ({ mount }) => {
    const component = await mount(<Drawer drawerWidth={240} mobileOpen={false} handleDrawerTransitionEnd={() => { }} handleDrawerClose={() => { }} />);
    const heading = component.getByRole("link", { name: 'アルゴ算額' });
    await expect(heading).toBeVisible();
  });

  test('has link to Map page', async ({ mount }) => {
    const component = await mount(<Drawer drawerWidth={240} mobileOpen={false} handleDrawerTransitionEnd={() => { }} handleDrawerClose={() => { }} />);
    const link = component.getByRole("link", { name: '神社を探す' });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', '#');
  });

  test('has link to CreateSangaku page', async ({ mount }) => {
    const component = await mount(<Drawer drawerWidth={240} mobileOpen={false} handleDrawerTransitionEnd={() => { }} handleDrawerClose={() => { }} />);
    const link = component.getByRole("link", { name: '算額を作る' });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', '#');
  });

  test('has link to AnswerSangaku page', async ({ mount }) => {
    const component = await mount(<Drawer drawerWidth={240} mobileOpen={false} handleDrawerTransitionEnd={() => { }} handleDrawerClose={() => { }} />);
    const link = component.getByRole("link", { name: '算額を解く' });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', '#');
  });

  test('has link to ShowOwnSangaku page', async ({ mount }) => {
    const component = await mount(<Drawer drawerWidth={240} mobileOpen={false} handleDrawerTransitionEnd={() => { }} handleDrawerClose={() => { }} />);
    const link = component.getByRole("link", { name: '自分の算額を見る' });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', '#');
  });

  test('has link to Logout', async ({ mount }) => {
    const component = await mount(<Drawer drawerWidth={240} mobileOpen={false} handleDrawerTransitionEnd={() => { }} handleDrawerClose={() => { }} />);
    const link = component.getByRole("link", { name: 'ログアウト' });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', '#');
  });

  test('has link to Privacy Policy page', async ({ mount }) => {
    const component = await mount(<Drawer drawerWidth={240} mobileOpen={false} handleDrawerTransitionEnd={() => { }} handleDrawerClose={() => { }} />);
    const link = component.getByRole("link", { name: 'プライバシーポリシー' });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', '#');
  });

  test('has link to Terms of use page', async ({ mount }) => {
    const component = await mount(<Drawer drawerWidth={240} mobileOpen={false} handleDrawerTransitionEnd={() => { }} handleDrawerClose={() => { }} />);
    const link = component.getByRole("link", { name: '利用規約' });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', '#');
  });
});
