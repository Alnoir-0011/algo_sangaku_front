import { test, expect } from '@playwright/experimental-ct-react';
import Drawer from '@/app/ui/navigation/Drawer';

test.describe("SideNav", () => {
  test('has AppName', async ({ mount }) => {
    const component = await mount(<Drawer />);
    const heading = component.getByRole("heading", { name: 'アルゴ算額' });
    expect(heading).toBeVisible();
  });

  test('has link to Map page', async ({ mount }) => {
    const component = await mount(<Drawer />);
    const link = component.getByRole("link", { name: '神社を探す' });
    expect(link).toBeVisible();
    expect(link).toHaveAttribute('href', '#');
  });

  test('has link to CreateSangaku page', async ({ mount }) => {
    const component = await mount(<Drawer />);
    const link = component.getByRole("link", { name: '算額を作る' });
    expect(link).toBeVisible();
    expect(link).toHaveAttribute('href', '#');
  });

  test('has link to AnswerSangaku page', async ({ mount }) => {
    const component = await mount(<Drawer />);
    const link = component.getByRole("link", { name: '算額を解く' });
    expect(link).toBeVisible();
    expect(link).toHaveAttribute('href', '#');
  });

  test('has link to ShowOwnSangaku page', async ({ mount }) => {
    const component = await mount(<Drawer />);
    const link = component.getByRole("link", { name: '自分の算額を見る' });
    expect(link).toBeVisible();
    expect(link).toHaveAttribute('href', '#');
  });

  test('has link to Logout', async ({ mount }) => {
    const component = await mount(<Drawer />);
    const link = component.getByRole("link", { name: 'ログアウト' });
    expect(link).toBeVisible();
    expect(link).toHaveAttribute('href', '#');
  });

  test('has link to Privacy Policy page', async ({ mount }) => {
    const component = await mount(<Drawer />);
    const link = component.getByRole("link", { name: 'プライバシーポリシー' });
    expect(link).toBeVisible();
    expect(link).toHaveAttribute('href', '#');
  });

  test('has link to Terms of use page', async ({ mount }) => {
    const component = await mount(<Drawer />);
    const link = component.getByRole("link", { name: '利用規約' });
    expect(link).toBeVisible();
    expect(link).toHaveAttribute('href', '#');
  });
});
