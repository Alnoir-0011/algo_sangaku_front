import { test, expect } from "@/tests/fixtures.ct";
import KindSelector from "@/app/ui/sangaku/reorder/KindSelector";

// KindSelector
test.describe("KindSelector", () => {
  // マウントされたとき、コード記述の kind リンクが見える
  test("should allow me to see code writing kind link when the component is mounted", async ({
    mount,
  }) => {
    const component = await mount(<KindSelector />);

    await expect(
      component.getByRole("link", { name: "コード記述形式で作成" }),
    ).toBeVisible();
  });

  // マウントされたとき、並べ替えの kind リンクが見える
  test("should allow me to see reorder kind link when the component is mounted", async ({
    mount,
  }) => {
    const component = await mount(<KindSelector />);

    await expect(
      component.getByRole("link", { name: "並べ替え形式で作成" }),
    ).toBeVisible();
  });

  // マウントされたとき、code の kind に遷移できる
  test("should allow me to navigate to code kind when the component is mounted", async ({
    mount,
  }) => {
    const component = await mount(<KindSelector />);

    await expect(
      component.getByRole("link", { name: "コード記述形式で作成" }),
    ).toHaveAttribute("href", "?kind=code");
  });

  // マウントされたとき、reorder の kind に遷移できる
  test("should allow me to navigate to reorder kind when the component is mounted", async ({
    mount,
  }) => {
    const component = await mount(<KindSelector />);

    await expect(
      component.getByRole("link", { name: "並べ替え形式で作成" }),
    ).toHaveAttribute("href", "?kind=reorder");
  });
});
