import { test, expect } from "@/tests/fixtures.ct";
import { SubmitTrigger } from "./SubmitFailureNoticeStories";
import { SUBMIT_FAILURE_MESSAGE_TEXT } from "@/tests/__helpers__/submit-failure";

// Provider は playwright/index.tsx のハーネスが全 CT に被せている。

// SubmitFailureNotice（送信失敗の通知）
test.describe("SubmitFailureNotice", () => {
  // 送信に失敗したとき、固定の失敗メッセージが見える
  test("should allow me to see the fixed failure message when the submission fails", async ({
    mount,
    page,
  }) => {
    // Arrange
    await mount(<SubmitTrigger failWith="network down" />);

    // Act
    await page.getByRole("button", { name: "送信" }).click();

    // Assert
    await expect(page.getByTestId("flash-message")).toHaveText(SUBMIT_FAILURE_MESSAGE_TEXT);
  });

  // 送信に失敗したとき、エラーの詳細が見えない
  test("should not allow me to see the error detail when the submission fails", async ({
    mount,
    page,
  }) => {
    // Arrange
    await mount(
      <SubmitTrigger failWith="https://internal.example/secret failed" />,
    );

    // Act
    await page.getByRole("button", { name: "送信" }).click();

    // Assert
    await expect(page.getByTestId("flash-message")).toBeVisible();
    await expect(page.getByText("internal.example")).toHaveCount(0);
  });

  // 送信に成功したとき、失敗メッセージが見えない
  test("should not allow me to see the failure message when the submission succeeds", async ({
    mount,
    page,
  }) => {
    // Arrange
    await mount(<SubmitTrigger />);

    // Act
    await page.getByRole("button", { name: "送信" }).click();

    // Assert
    await expect(page.getByRole("button", { name: "送信" })).toBeEnabled();
    await expect(page.getByTestId("flash-message")).toHaveCount(0);
  });

  // 閉じたあとにもう一度送信に失敗したとき、失敗メッセージがもう一度見える
  test("should allow me to see the failure message again when the submission fails again after I closed it", async ({
    mount,
    page,
  }) => {
    // Arrange
    await mount(<SubmitTrigger failWith="network down" />);
    await page.getByRole("button", { name: "送信" }).click();
    await expect(page.getByTestId("flash-message")).toBeVisible();
    await page.getByRole("button", { name: "Close" }).click();
    await expect(page.getByTestId("flash-message")).toHaveCount(0);

    // Act
    await page.getByRole("button", { name: "送信" }).click();

    // Assert
    await expect(page.getByTestId("flash-message")).toHaveText(SUBMIT_FAILURE_MESSAGE_TEXT);
  });
});
