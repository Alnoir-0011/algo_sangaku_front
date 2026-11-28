import { test, expect } from "@/tests/fixtures.ct";
import GenerateSourceUsageIndicator from "@/app/ui/sangaku/GenerateSourceUsageIndicator";

// GenerateSourceUsageIndicator
test.describe("GenerateSourceUsageIndicator", () => {
  // usage が undefined のとき、プレースホルダーが見える
  test("should allow me to see placeholder when usage is undefined", async ({ mount }) => {
    const component = await mount(
      <GenerateSourceUsageIndicator usage={undefined} />,
    );
    await expect(
      component.getByText("本日の残り生成回数: - / -"),
    ).toBeVisible();
  });

  // usage が渡されたとき、残り回数が見える
  test("should allow me to see remaining count when usage is provided", async ({ mount }) => {
    const component = await mount(
      <GenerateSourceUsageIndicator
        usage={{ used: 2, limit: 5, remaining: 3, reset_at: "2026-01-01" }}
      />,
    );
    await expect(
      component.getByText("本日の残り生成回数: 3 / 5"),
    ).toBeVisible();
  });

  // 使い切ったとき、残り 0 回が見える
  test("should allow me to see zero remaining when exhausted", async ({ mount }) => {
    const component = await mount(
      <GenerateSourceUsageIndicator
        usage={{ used: 5, limit: 5, remaining: 0, reset_at: "2026-01-01" }}
      />,
    );
    await expect(
      component.getByText("本日の残り生成回数: 0 / 5"),
    ).toBeVisible();
  });
});
