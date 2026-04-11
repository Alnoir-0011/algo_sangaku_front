import { test, expect } from "@playwright/experimental-ct-react";
import Ema from "@/app/ui/Ema";

test.describe("Ema", () => {
  test("renders children", async ({ mount }) => {
    const component = await mount(<Ema width={18}>テストコンテンツ</Ema>);
    await expect(component.getByText("テストコンテンツ")).toBeVisible();
  });

  test("renders with custom width", async ({ mount }) => {
    const component = await mount(<Ema width={24}>コンテンツ</Ema>);
    await expect(component.getByText("コンテンツ")).toBeVisible();
  });
});
