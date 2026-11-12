import { test, expect } from "@/tests/fixtures.ct";
import { SangakuSaveButton } from "@/app/ui/shrine/sangakus/SangakuSaveButton";
import { SUBMIT_FAILURE_MESSAGE_TEXT } from "@/tests/__helpers__/submit-failure";

test.describe("SangakuSaveButton", () => {
  test("should allow me to see an enabled 算額を写す button when saved is false", async ({
    mount,
    page,
  }) => {
    await mount(<SangakuSaveButton id="1" saved={false} />);

    // マウントしたコンポーネントのルート要素がボタン自体のため、component スコープではなく page スコープで検索する
    const button = page.getByRole("button", { name: "算額を写す" });
    await expect(button).toBeVisible();
    await expect(button).toBeEnabled();
  });

  test("should allow me to see a disabled 保存済み button when saved is true", async ({
    mount,
    page,
  }) => {
    await mount(<SangakuSaveButton id="1" saved={true} />);

    const button = page.getByRole("button", { name: "保存済み" });
    await expect(button).toBeVisible();
    await expect(button).toBeDisabled();
  });

  test("should allow me to see the button switch to 保存済み after a successful save", async ({
    mount,
    page,
  }) => {
    await mount(<SangakuSaveButton id="1" saved={false} />);

    await page.getByRole("button", { name: "算額を写す" }).click();

    const savedButton = page.getByRole("button", { name: "保存済み" });
    await expect(savedButton).toBeVisible();
    await expect(savedButton).toBeDisabled();
  });

  test("should not allow me to save twice when I double-click the button while saving", async ({
    mount,
    page,
  }) => {
    // Arrange
    await mount(<SangakuSaveButton id="1" saved={false} />, {
      hooksConfig: { actionHold: true },
    });
    const button = page.getByRole("button", { name: "算額を写す" });

    // Act
    await button.dblclick();

    // Assert
    await expect(button).toBeDisabled();
    await page.evaluate(() => window.__releaseActions?.());
    await expect(page.getByRole("button", { name: "保存済み" })).toBeVisible();
    const calls = await page.evaluate(
      () => window.__actionCalls?.createSangakuSave ?? 0,
    );
    expect(calls).toBe(1);
  });

  test("should allow me to keep the page and click the button again when the request fails", async ({
    mount,
    page,
  }) => {
    // Arrange
    const pageErrors: Error[] = [];
    page.on("pageerror", (error) => pageErrors.push(error));
    await mount(<SangakuSaveButton id="1" saved={false} />, {
      hooksConfig: { actionRejectCount: 1 },
    });
    const button = page.getByRole("button", { name: "算額を写す" });

    // Act
    await button.click();

    // Assert
    await expect(button).toBeEnabled();
    expect(pageErrors).toEqual([]);
  });

  test("should allow me to see the failure message when the request fails", async ({
    mount,
    page,
  }) => {
    // Arrange
    await mount(<SangakuSaveButton id="1" saved={false} />, {
      hooksConfig: { actionRejectCount: 1 },
    });

    // Act
    await page.getByRole("button", { name: "算額を写す" }).click();

    // Assert
    await expect(page.getByTestId("flash-message")).toHaveText(
      SUBMIT_FAILURE_MESSAGE_TEXT,
    );
  });
});
