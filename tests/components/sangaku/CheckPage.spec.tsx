import { test, expect } from "@/tests/fixtures.ct";
import CheckPage from "@/app/ui/sangaku/CheckPage";

// MUI Modal は React Portal で document.body 直下にレンダリングされるため、
// マウント済みコンポーネントのルート配下に限定される component.getByRole ではなく、
// ページ全体を対象にする page.getByRole を使う。
test.describe("CheckPage", () => {
  test("should allow me to click the save button when isPending is false", async ({
    mount,
    page,
  }) => {
    // Act
    await mount(
      <CheckPage
        open={true}
        onClose={() => {}}
        source="puts 1"
        fixedInputs={[]}
        isPending={false}
      />,
    );

    // Assert
    await expect(page.getByRole("button", { name: "保存する" })).toBeEnabled();
  });

  test("should not allow me to click the save button when isPending is true", async ({
    mount,
    page,
  }) => {
    // Act
    await mount(
      <CheckPage
        open={true}
        onClose={() => {}}
        source="puts 1"
        fixedInputs={[]}
        isPending={true}
      />,
    );

    // Assert
    await expect(page.getByRole("button", { name: "保存する" })).toBeDisabled();
  });
});
