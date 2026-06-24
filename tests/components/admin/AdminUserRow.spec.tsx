import { test, expect } from "@/tests/fixtures.ct";
import AdminUserRow from "@/app/ui/admin/AdminUserRow";

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

test.describe("AdminUserRow", () => {
  test("should allow me to see user nickname", async ({ mount }) => {
    const component = await mount(
      <table><tbody><AdminUserRow user={user} /></tbody></table>,
    );
    await expect(component.getByText("testuser")).toBeVisible();
  });

  test("should allow me to see user email", async ({ mount }) => {
    const component = await mount(
      <table><tbody><AdminUserRow user={user} /></tbody></table>,
    );
    await expect(component.getByText("test@example.com")).toBeVisible();
  });

  test("should allow me to see current role as text", async ({ mount }) => {
    const component = await mount(
      <table><tbody><AdminUserRow user={user} /></tbody></table>,
    );
    await expect(component.getByText("general")).toBeVisible();
  });

  test("should allow me to see edit link", async ({ mount }) => {
    const component = await mount(
      <table><tbody><AdminUserRow user={user} /></tbody></table>,
    );
    await expect(component.getByRole("link", { name: "編集" })).toBeVisible();
  });

  test("should allow me to see sangaku count", async ({ mount }) => {
    const component = await mount(
      <table><tbody><AdminUserRow user={user} /></tbody></table>,
    );
    await expect(component.getByRole("cell", { name: "3" })).toBeVisible();
  });

  test("should allow me to see answer count", async ({ mount }) => {
    const component = await mount(
      <table><tbody><AdminUserRow user={user} /></tbody></table>,
    );
    await expect(component.getByRole("cell", { name: "7" })).toBeVisible();
  });

  // RED: AdminUserRow に created_at カラムが存在しない（TableCell で YYYY/MM/DD 形式の日付を表示する実装が未着手）
  test("should allow me to see created_at formatted as YYYY/MM/DD when ISO string is provided", async ({ mount }) => {
    // Arrange: 上部 user 定数の created_at = "2026-01-01T00:00:00.000+09:00" を使用
    // Act
    const component = await mount(
      <table><tbody><AdminUserRow user={user} /></tbody></table>,
    );
    // Assert
    await expect(component.getByRole("cell", { name: "2026/01/01" })).toBeVisible();
  });

  // RED: AdminUserRow に created_at カラムが存在しない（TableCell で YYYY/MM/DD 形式の日付を表示する実装が未着手）
  test("should allow me to see created_at formatted as YYYY/MM/DD when another ISO string is provided", async ({ mount }) => {
    // Arrange
    const userWithDifferentDate = {
      ...user,
      attributes: {
        ...user.attributes,
        created_at: "2025-12-31T23:59:59.000+09:00",
      },
    };
    // Act
    const component = await mount(
      <table><tbody><AdminUserRow user={userWithDifferentDate} /></tbody></table>,
    );
    // Assert
    await expect(component.getByRole("cell", { name: "2025/12/31" })).toBeVisible();
  });
});
