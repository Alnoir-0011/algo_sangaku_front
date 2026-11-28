import { test, expect } from "@/tests/fixtures.ct";
import {
  SourceResultLoading,
  ResultLoading,
} from "@/app/ui/answer/LoadingCirclars";

// SourceResultLoading コンポーネント
test.describe("SourceResultLoading", () => {
  // ローディング表示が見える
  test("should allow me to see loading indicator", async ({ mount, page }) => {
    await mount(<SourceResultLoading />);
    await expect(page.getByRole("progressbar")).toBeVisible();
  });
});

// ResultLoading コンポーネント
test.describe("ResultLoading", () => {
  // インデックス付きのローディング表示が見える
  test("should allow me to see loading indicator with index", async ({ mount }) => {
    const component = await mount(<ResultLoading index={0} />);
    await expect(component.getByText("1")).toBeVisible();
  });

  // 正しいインデックス番号が見える
  test("should allow me to see correct index number", async ({ mount }) => {
    const component = await mount(<ResultLoading index={2} />);
    await expect(component.getByText("3")).toBeVisible();
  });
});
