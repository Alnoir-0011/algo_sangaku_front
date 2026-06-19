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

test.describe("AdminShrineRow", () => {
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
