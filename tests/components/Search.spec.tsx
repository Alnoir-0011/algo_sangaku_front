import { test, expect } from "@/tests/fixtures.ct";
import Search from "@/app/ui/Search";

test.describe("Search", () => {
  test("should allow me to see the format filter select when kind prop is true", async ({
    mount,
  }) => {
    // Arrange & Act
    const component = await mount(<Search placeholder="検索" kind />);

    // Assert
    await expect(component.getByRole("combobox")).toBeVisible();
  });

  test("should not allow me to see the format filter select when kind prop is not given", async ({
    mount,
  }) => {
    // Arrange & Act
    const component = await mount(<Search placeholder="検索" />);

    // Assert
    await expect(component.getByRole("combobox")).not.toBeVisible();
  });

  test("should allow me to see all option when the format filter select is opened", async ({
    mount,
    page,
  }) => {
    // Arrange
    const component = await mount(<Search placeholder="検索" kind />);

    // Act
    await component.getByRole("combobox").click();

    // Assert
    // MUI Select のドロップダウンは Portal で document.body 直下に描画されるため、
    // マウント済みコンポーネントのルート配下に限定される component.getByRole ではなく、
    // ページ全体を対象にする page.getByRole を使う
    await expect(page.getByRole("option", { name: "全て" })).toBeVisible();
  });

  test("should allow me to see code option when the format filter select is opened", async ({
    mount,
    page,
  }) => {
    // Arrange
    const component = await mount(<Search placeholder="検索" kind />);

    // Act
    await component.getByRole("combobox").click();

    // Assert
    // MUI Select のドロップダウンは Portal 描画のため page.getByRole を使う（上記コメント参照）
    await expect(
      page.getByRole("option", { name: "コード記述" }),
    ).toBeVisible();
  });

  test("should allow me to see reorder option when the format filter select is opened", async ({
    mount,
    page,
  }) => {
    // Arrange
    const component = await mount(<Search placeholder="検索" kind />);

    // Act
    await component.getByRole("combobox").click();

    // Assert
    // MUI Select のドロップダウンは Portal 描画のため page.getByRole を使う（上記コメント参照）
    await expect(
      page.getByRole("option", { name: "並べ替え" }),
    ).toBeVisible();
  });

  test("should allow me to see updated selected value when code option is selected", async ({
    mount,
    page,
  }) => {
    // Arrange
    const component = await mount(<Search placeholder="検索" kind />);

    // Act
    // handleSelect 相当の処理（difficulty と同じ URLSearchParams 経由での
    // kind クエリパラメータ更新）が呼ばれることを、選択後の表示値の変化から確認する
    await component.getByRole("combobox").click();
    await page.getByRole("option", { name: "コード記述" }).click();

    // Assert
    await expect(component.getByRole("combobox")).toHaveText("コード記述");
  });

  test("should allow me to see updated selected value when reorder option is selected", async ({
    mount,
    page,
  }) => {
    // Arrange
    const component = await mount(<Search placeholder="検索" kind />);

    // Act
    // handleSelect 相当の処理（difficulty と同じ URLSearchParams 経由での
    // kind クエリパラメータ更新）が呼ばれることを、選択後の表示値の変化から確認する
    await component.getByRole("combobox").click();
    await page.getByRole("option", { name: "並べ替え" }).click();

    // Assert
    await expect(component.getByRole("combobox")).toHaveText("並べ替え");
  });
});
