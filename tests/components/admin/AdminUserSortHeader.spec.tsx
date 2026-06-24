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

  // RED: AdminUserSortHeader コンポーネントが未実装（currentSort=undefined 時は降順をデフォルト表示する仕様）
  test("should allow me to see descending sort indicator when currentSort is undefined", async ({ mount }) => {
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
    await expect(component.getByRole("columnheader")).toHaveAttribute("aria-sort", "descending");
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

  // RED: AdminUserSortHeader コンポーネントが未実装（query 未渡し時は sort パラメータのみ付与）
  test("should allow me to navigate to ?sort=asc when currentSort is undefined", async ({ mount }) => {
    // Arrange: query prop を渡さない（undefined）
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
    await expect(component.getByTestId("sort-link")).toHaveAttribute("href", "?sort=asc");
  });

  // RED: AdminUserSortHeader コンポーネントが未実装（query 未渡し時は sort パラメータのみ付与）
  test("should allow me to navigate to ?sort=desc when currentSort is asc", async ({ mount }) => {
    // Arrange: query prop を渡さない（undefined）
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
    await expect(component.getByTestId("sort-link")).toHaveAttribute("href", "?sort=desc");
  });

  // RED: AdminUserSortHeader コンポーネントが未実装（query 未渡し時は sort パラメータのみ付与）
  test("should allow me to navigate to ?sort=asc when currentSort is desc", async ({ mount }) => {
    // Arrange: query prop を渡さない（undefined）
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
    await expect(component.getByTestId("sort-link")).toHaveAttribute("href", "?sort=asc");
  });

  // RED: AdminUserSortHeader コンポーネントが未実装（query を持つ場合は sort と query 両方を保持）
  test("should allow me to navigate to ?sort=asc and preserve query param when currentSort is undefined", async ({ mount }) => {
    // Arrange
    // Act
    const component = await mount(
      <table>
        <thead>
          <tr>
            <AdminUserSortHeader currentSort={undefined} query="foo" />
          </tr>
        </thead>
      </table>,
    );
    // Assert
    await expect(component.getByTestId("sort-link")).toHaveAttribute("href", "?query=foo&sort=asc");
  });

  // RED: AdminUserSortHeader コンポーネントが未実装（query を持つ場合は sort と query 両方を保持）
  test("should allow me to navigate to ?sort=desc and preserve query param when currentSort is asc", async ({ mount }) => {
    // Arrange
    // Act
    const component = await mount(
      <table>
        <thead>
          <tr>
            <AdminUserSortHeader currentSort="asc" query="foo" />
          </tr>
        </thead>
      </table>,
    );
    // Assert
    await expect(component.getByTestId("sort-link")).toHaveAttribute("href", "?query=foo&sort=desc");
  });

  // RED: AdminUserSortHeader コンポーネントが未実装（query を持つ場合は sort と query 両方を保持）
  test("should allow me to navigate to ?sort=asc and preserve query param when currentSort is desc", async ({ mount }) => {
    // Arrange
    // Act
    const component = await mount(
      <table>
        <thead>
          <tr>
            <AdminUserSortHeader currentSort="desc" query="foo" />
          </tr>
        </thead>
      </table>,
    );
    // Assert
    await expect(component.getByTestId("sort-link")).toHaveAttribute("href", "?query=foo&sort=asc");
  });

  // RED: AdminUserSortHeader コンポーネントが未実装（query が空文字の場合は sort パラメータのみ付与）
  test("should allow me to navigate to ?sort=asc without query param when query is empty and currentSort is undefined", async ({ mount }) => {
    // Arrange
    // Act
    const component = await mount(
      <table>
        <thead>
          <tr>
            <AdminUserSortHeader currentSort={undefined} query="" />
          </tr>
        </thead>
      </table>,
    );
    // Assert
    await expect(component.getByTestId("sort-link")).toHaveAttribute("href", "?sort=asc");
  });
});
