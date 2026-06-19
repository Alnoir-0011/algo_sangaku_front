import { test, expect } from "@/tests/fixtures.ct";
import AdminSangakuRow from "@/app/ui/admin/AdminSangakuRow";

const sangaku = {
  id: "1",
  type: "sangaku" as const,
  attributes: {
    title: "テスト算額",
    difficulty: "easy" as const,
    created_at: "2026-01-01T00:00:00.000+09:00",
    user_name: "test_user",
    shrine_name: "test_shrine",
    description: "テスト説明文",
    source: "print('hello')",
  },
};

const sangakuWithoutShrine = {
  ...sangaku,
  attributes: {
    ...sangaku.attributes,
    shrine_name: null,
  },
};

test.describe("AdminSangakuRow", () => {
  test("should allow me to see sangaku title", async ({ mount }) => {
    const component = await mount(
      <table>
        <tbody>
          <AdminSangakuRow sangaku={sangaku} />
        </tbody>
      </table>,
    );
    await expect(component.getByText("テスト算額")).toBeVisible();
  });

  test("should allow me to see user name", async ({ mount }) => {
    const component = await mount(
      <table>
        <tbody>
          <AdminSangakuRow sangaku={sangaku} />
        </tbody>
      </table>,
    );
    await expect(component.getByText("test_user")).toBeVisible();
  });

  test("should allow me to see shrine name when dedicated", async ({ mount }) => {
    const component = await mount(
      <table>
        <tbody>
          <AdminSangakuRow sangaku={sangaku} />
        </tbody>
      </table>,
    );
    await expect(component.getByText("test_shrine")).toBeVisible();
  });

  test("should allow me to see fallback text when not dedicated", async ({ mount }) => {
    const component = await mount(
      <table>
        <tbody>
          <AdminSangakuRow sangaku={sangakuWithoutShrine} />
        </tbody>
      </table>,
    );
    await expect(component.getByText("未奉納")).toBeVisible();
  });

  test("should allow me to see edit link", async ({ mount }) => {
    const component = await mount(
      <table>
        <tbody>
          <AdminSangakuRow sangaku={sangaku} />
        </tbody>
      </table>,
    );
    await expect(component.getByRole("link", { name: "編集" })).toBeVisible();
  });

  test("should allow me to see delete button", async ({ mount }) => {
    const component = await mount(
      <table>
        <tbody>
          <AdminSangakuRow sangaku={sangaku} />
        </tbody>
      </table>,
    );
    await expect(component.getByRole("button", { name: "削除" })).toBeVisible();
  });
});
