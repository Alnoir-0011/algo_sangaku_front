import { test, expect } from "@/tests/fixtures.ct";
import AdminSangakuForm from "@/app/ui/admin/AdminSangakuForm";

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

test.describe("AdminSangakuForm", () => {
  test("should allow me to see pre-filled title with existing sangaku data", async ({ mount }) => {
    const component = await mount(<AdminSangakuForm sangaku={sangaku} />);
    await expect(component.getByLabel("タイトル")).toHaveValue("テスト算額");
  });

  test("should allow me to see difficulty select with current value", async ({
    mount,
  }) => {
    const component = await mount(<AdminSangakuForm sangaku={sangaku} />);
    await expect(component.getByRole("combobox")).toHaveValue("easy");
  });

  test("should allow me to see pre-filled description with existing sangaku data", async ({
    mount,
  }) => {
    const component = await mount(<AdminSangakuForm sangaku={sangaku} />);
    await expect(component.getByLabel("説明文")).toHaveValue("テスト説明文");
  });

  test("should allow me to see pre-filled source with existing sangaku data", async ({
    mount,
  }) => {
    const component = await mount(<AdminSangakuForm sangaku={sangaku} />);
    await expect(component.getByLabel("想定回答")).toHaveValue("print('hello')");
  });

  test("should allow me to see update button", async ({ mount }) => {
    const component = await mount(<AdminSangakuForm sangaku={sangaku} />);
    await expect(component.getByRole("button", { name: "更新" })).toBeVisible();
  });
});
