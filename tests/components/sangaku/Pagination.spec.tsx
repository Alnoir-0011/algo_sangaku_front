import { test, expect } from "@/tests/fixtures.ct";
import Pagination from "@/app/ui/Pagination";

test.describe("Pagination", () => {
  test("should allow me to see pagination buttons when total page is 3", async ({ mount }) => {
    const component = await mount(<Pagination totalPage={3} />);
    await expect(component.getByRole("button", { name: "page 2" })).toBeVisible();
    await expect(component.getByRole("button", { name: "page 3" })).toBeVisible();
  });

  test("should allow me to click a page button without errors", async ({ mount }) => {
    const component = await mount(<Pagination totalPage={3} />);
    // クリックでonChangeが呼ばれ（router.pushが実行され）エラーが発生しないことを確認
    await component.getByRole("button", { name: "page 2" }).click();
    await expect(component.getByRole("button", { name: "page 2" })).toBeVisible();
  });
});
