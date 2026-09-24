import { test, expect } from "@/tests/fixtures.ct";
import KindSelector from "@/app/ui/sangaku/reorder/KindSelector";

test.describe("KindSelector", () => {
  test("should allow me to see code writing kind link when the component is mounted", async ({
    mount,
  }) => {
    const component = await mount(<KindSelector />);

    await expect(
      component.getByRole("link", { name: "コード記述形式で作成" }),
    ).toBeVisible();
  });

  test("should allow me to see reorder kind link when the component is mounted", async ({
    mount,
  }) => {
    const component = await mount(<KindSelector />);

    await expect(
      component.getByRole("link", { name: "並べ替え形式で作成" }),
    ).toBeVisible();
  });

  test("should allow me to navigate to code kind when the component is mounted", async ({
    mount,
  }) => {
    const component = await mount(<KindSelector />);

    await expect(
      component.getByRole("link", { name: "コード記述形式で作成" }),
    ).toHaveAttribute("href", "?kind=code");
  });

  test("should allow me to navigate to reorder kind when the component is mounted", async ({
    mount,
  }) => {
    const component = await mount(<KindSelector />);

    await expect(
      component.getByRole("link", { name: "並べ替え形式で作成" }),
    ).toHaveAttribute("href", "?kind=reorder");
  });
});
