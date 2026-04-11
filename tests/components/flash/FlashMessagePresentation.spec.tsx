import { test, expect } from "@playwright/experimental-ct-react";
import FlashMessagePresentation from "@/app/ui/flash/FlashMessagePresentation";

test.describe("FlashMessagePresentation", () => {
  test("shows success message", async ({ mount }) => {
    const component = await mount(
      <FlashMessagePresentation type="success" message="操作が完了しました" />,
    );
    await expect(component.getByText("操作が完了しました")).toBeVisible();
  });

  test("shows error message", async ({ mount }) => {
    const component = await mount(
      <FlashMessagePresentation type="error" message="エラーが発生しました" />,
    );
    await expect(component.getByText("エラーが発生しました")).toBeVisible();
  });

  test("shows info message", async ({ mount }) => {
    const component = await mount(
      <FlashMessagePresentation type="info" message="情報メッセージ" />,
    );
    await expect(component.getByText("情報メッセージ")).toBeVisible();
  });

  test("shows warning message", async ({ mount }) => {
    const component = await mount(
      <FlashMessagePresentation type="warning" message="警告メッセージ" />,
    );
    await expect(component.getByText("警告メッセージ")).toBeVisible();
  });
});
