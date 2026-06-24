import { test, expect } from "@/tests/fixtures.ct";
import AdminUserSortHeader from "@/app/ui/admin/AdminUserSortHeader";

// RED: AdminUserSortHeader コンポーネントが未実装（app/ui/admin/AdminUserSortHeader.tsx が存在しない）

test.describe("AdminUserSortHeader", () => {
  // RED: AdminUserSortHeader コンポーネントが未実装
  test("should allow me to see label text 登録日時 when rendered", async ({ mount }) => {
    // Arrange
    // Act
    const component = await mount(
      <table>
        <thead>
          <tr>
            <AdminUserSortHeader currentSort={undefined} />
          </tr>
        </thead>
      </table>,
    );
    // Assert
    await expect(component.getByRole("columnheader", { name: /登録日時/ })).toBeVisible();
  });

  // RED: AdminUserSortHeader コンポーネントが未実装
  test("should allow me to see columnheader when currentSort is undefined", async ({ mount }) => {
    // Arrange
    // Act
    const component = await mount(
      <table>
        <thead>
          <tr>
            <AdminUserSortHeader currentSort={undefined} />
          </tr>
        </thead>
      </table>,
    );
    // Assert
    await expect(component.getByRole("columnheader")).toBeVisible();
  });

  // RED: AdminUserSortHeader コンポーネントが未実装
  test("should allow me to see sort button when currentSort is undefined", async ({ mount }) => {
    // Arrange
    // Act
    const component = await mount(
      <table>
        <thead>
          <tr>
            <AdminUserSortHeader currentSort={undefined} />
          </tr>
        </thead>
      </table>,
    );
    // Assert
    await expect(component.getByRole("button")).toBeVisible();
  });

  // RED: AdminUserSortHeader コンポーネントが未実装
  test("should allow me to see columnheader without aria-sort when currentSort is undefined", async ({ mount }) => {
    // Arrange
    // Act
    const component = await mount(
      <table>
        <thead>
          <tr>
            <AdminUserSortHeader currentSort={undefined} />
          </tr>
        </thead>
      </table>,
    );
    // Assert
    await expect(component.getByRole("columnheader")).not.toHaveAttribute("aria-sort");
  });

  // RED: AdminUserSortHeader コンポーネントが未実装
  test("should allow me to see ascending sort indicator when currentSort is asc", async ({ mount }) => {
    // Arrange
    // Act
    const component = await mount(
      <table>
        <thead>
          <tr>
            <AdminUserSortHeader currentSort="asc" />
          </tr>
        </thead>
      </table>,
    );
    // Assert
    await expect(component.getByRole("columnheader")).toHaveAttribute("aria-sort", "ascending");
  });

  // RED: AdminUserSortHeader コンポーネントが未実装
  test("should allow me to see descending sort indicator when currentSort is desc", async ({ mount }) => {
    // Arrange
    // Act
    const component = await mount(
      <table>
        <thead>
          <tr>
            <AdminUserSortHeader currentSort="desc" />
          </tr>
        </thead>
      </table>,
    );
    // Assert
    await expect(component.getByRole("columnheader")).toHaveAttribute("aria-sort", "descending");
  });

  // RED: AdminUserSortHeader コンポーネントが未実装
  test("should allow me to navigate to ?sort=asc when currentSort is undefined", async ({ mount }) => {
    // Arrange
    // Act
    const component = await mount(
      <table>
        <thead>
          <tr>
            <AdminUserSortHeader currentSort={undefined} />
          </tr>
        </thead>
      </table>,
    );
    // Assert
    await expect(component.getByTestId("sort-link")).toHaveAttribute("href", /sort=asc/);
  });

  // RED: AdminUserSortHeader コンポーネントが未実装
  test("should allow me to navigate to ?sort=desc when currentSort is asc", async ({ mount }) => {
    // Arrange
    // Act
    const component = await mount(
      <table>
        <thead>
          <tr>
            <AdminUserSortHeader currentSort="asc" />
          </tr>
        </thead>
      </table>,
    );
    // Assert
    await expect(component.getByTestId("sort-link")).toHaveAttribute("href", /sort=desc/);
  });

  // RED: AdminUserSortHeader コンポーネントが未実装
  test("should allow me to navigate to ?sort=asc when currentSort is desc", async ({ mount }) => {
    // Arrange
    // Act
    const component = await mount(
      <table>
        <thead>
          <tr>
            <AdminUserSortHeader currentSort="desc" />
          </tr>
        </thead>
      </table>,
    );
    // Assert
    await expect(component.getByTestId("sort-link")).toHaveAttribute("href", /sort=asc/);
  });
});
