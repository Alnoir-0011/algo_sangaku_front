import { test, expect } from "@/tests/fixtures.ct";
import Pagination from "@/app/ui/Pagination";

// Pagination
test.describe("Pagination", () => {
  // 総ページ数が 3 のとき、ページネーションのボタンが見える
  test("should allow me to see pagination buttons when total page is 3", async ({ mount }) => {
    const component = await mount(<Pagination totalPage={3} />);
    await expect(component.getByRole("button", { name: "2ページ目" })).toBeVisible();
    await expect(component.getByRole("button", { name: "3ページ目" })).toBeVisible();
  });

  // ページボタンをエラーなくクリックできる
  test("should allow me to click a page button without errors", async ({ mount }) => {
    const component = await mount(<Pagination totalPage={3} />);
    // クリックでonChangeが呼ばれ（router.pushが実行され）エラーが発生しないことを確認
    await component.getByRole("button", { name: "2ページ目" }).click();
    await expect(component.getByRole("button", { name: "2ページ目" })).toBeVisible();
  });
});
