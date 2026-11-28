import { test, expect } from "@/tests/fixtures.ct";
import Ema from "@/app/ui/Ema";

// Ema（絵馬）
test.describe("Ema", () => {
  // 子要素の内容が見える
  test("should allow me to see children content", async ({ mount }) => {
    const component = await mount(<Ema width={18}>テストコンテンツ</Ema>);
    await expect(component.getByText("テストコンテンツ")).toBeVisible();
  });

  // width を渡しても、内容が見える
  test("should allow me to see content with custom width", async ({ mount }) => {
    const component = await mount(<Ema width={24}>コンテンツ</Ema>);
    await expect(component.getByText("コンテンツ")).toBeVisible();
  });
});
