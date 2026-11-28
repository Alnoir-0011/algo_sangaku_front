import { test, expect } from "@/tests/fixtures.ct";
import AdminShrineRow from "@/app/ui/admin/AdminShrineRow";

const shrine = {
  id: "1",
  type: "shrine" as const,
  attributes: {
    name: "test_shrine",
    address: "東京都千代田区1-1",
    latitude: 35.681236,
    longitude: 139.767125,
    sangaku_count: 2,
  },
};

// AdminShrineRow
test.describe("AdminShrineRow", () => {
  // 神社名が見える
  test("should allow me to see shrine name", async ({ mount }) => {
    const component = await mount(
      <table>
        <tbody>
          <AdminShrineRow shrine={shrine} />
        </tbody>
      </table>,
    );
    await expect(component.getByText("test_shrine")).toBeVisible();
  });

  // 神社の住所が見える
  test("should allow me to see shrine address", async ({ mount }) => {
    const component = await mount(
      <table>
        <tbody>
          <AdminShrineRow shrine={shrine} />
        </tbody>
      </table>,
    );
    await expect(component.getByText("東京都千代田区1-1")).toBeVisible();
  });

  // 算額数が見える
  test("should allow me to see sangaku count", async ({ mount }) => {
    const component = await mount(
      <table>
        <tbody>
          <AdminShrineRow shrine={shrine} />
        </tbody>
      </table>,
    );
    await expect(component.getByRole("cell", { name: "2" })).toBeVisible();
  });

  // 神社詳細ページへの編集リンクが見える
  test("should allow me to see edit link to shrine detail page", async ({ mount }) => {
    const component = await mount(
      <table>
        <tbody>
          <AdminShrineRow shrine={shrine} />
        </tbody>
      </table>,
    );
    await expect(component.getByRole("link", { name: "編集" })).toHaveAttribute(
      "href",
      "/admin/shrines/1/edit",
    );
  });
});
