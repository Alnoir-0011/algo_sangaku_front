import { test, expect } from "@/tests/fixtures.ct";
import AdminUserForm from "@/app/ui/admin/AdminUserForm";

const user = {
  id: "1",
  type: "user" as const,
  attributes: {
    name: "Test User",
    email: "test@example.com",
    nickname: "testuser",
    role: "general" as const,
    created_at: "2026-01-01T00:00:00.000+09:00",
    sangaku_count: 3,
    answer_count: 7,
  },
};

test.describe("AdminUserForm", () => {
  test("should allow me to see pre-filled name with existing user data", async ({ mount }) => {
    const component = await mount(<AdminUserForm user={user} />);
    await expect(component.getByLabel("名前")).toHaveValue("Test User");
  });

  test("should allow me to see pre-filled nickname with existing user data", async ({ mount }) => {
    const component = await mount(<AdminUserForm user={user} />);
    await expect(component.getByLabel("ニックネーム")).toHaveValue("testuser");
  });

  test("should allow me to see role select with current value", async ({ mount }) => {
    const component = await mount(<AdminUserForm user={user} />);
    await expect(component.getByRole("combobox")).toHaveValue("general");
  });

  test("should allow me to see update button", async ({ mount }) => {
    const component = await mount(<AdminUserForm user={user} />);
    await expect(component.getByRole("button", { name: "更新" })).toBeVisible();
  });
});
