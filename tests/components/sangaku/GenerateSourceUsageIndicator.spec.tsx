import { test, expect } from "@playwright/experimental-ct-react";
import GenerateSourceUsageIndicator from "@/app/ui/sangaku/generate-source-usage-indicator";

test.describe("GenerateSourceUsageIndicator", () => {
  test("shows placeholder when usage is undefined", async ({ mount }) => {
    const component = await mount(
      <GenerateSourceUsageIndicator usage={undefined} />,
    );
    await expect(
      component.getByText("本日の残り生成回数: - / -"),
    ).toBeVisible();
  });

  test("shows remaining count when usage is provided", async ({ mount }) => {
    const component = await mount(
      <GenerateSourceUsageIndicator
        usage={{ used: 2, limit: 5, remaining: 3, reset_at: "2026-01-01" }}
      />,
    );
    await expect(
      component.getByText("本日の残り生成回数: 3 / 5"),
    ).toBeVisible();
  });

  test("shows zero remaining when exhausted", async ({ mount }) => {
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
