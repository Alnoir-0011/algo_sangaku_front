import { test, expect } from "@/tests/fixtures.ct";
import { SangakuFormWithHeldAction } from "./SangakuFormStories";

test.describe("SangakuForm", () => {
  test("should not allow me to submit the form twice when I double-click the save button while the action is running", async ({
    mount,
    page,
  }) => {
    // Arrange
    const component = await mount(
      <SangakuFormWithHeldAction
        initialState={{}}
        initialSource="puts 1"
        initialDescription="test_description"
        initialFixedInputs={[]}
        initialDifficulty="normal"
        initialUsage={undefined}
      />,
      { hooksConfig: { actionHold: true } },
    );
    await component.getByRole("button", { name: "確認画面へ" }).click();
    // MUI Modal は Portal で document.body 直下に描画されるため page.getByRole を使う
    const saveButton = page.getByRole("button", { name: "保存する" });

    // Act
    await saveButton.dblclick();

    // Assert
    await expect(saveButton).toBeDisabled();
    await page.evaluate(() => window.__releaseActions?.());
    await expect(saveButton).toBeHidden();
    const actionCallCount = await page.evaluate(
      () => window.__actionCalls?.formAction ?? 0,
    );
    expect(actionCallCount).toBe(1);
  });
});
