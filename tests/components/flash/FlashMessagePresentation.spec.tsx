import { test, expect } from "@/tests/fixtures.ct";
import FlashMessagePresentation from "@/app/ui/flash/FlashMessagePresentation";

// FlashMessagePresentation（フラッシュメッセージの表示）
test.describe("FlashMessagePresentation", () => {
  // 成功メッセージが見える
  test("should allow me to see success message", async ({ mount }) => {
    const component = await mount(
      <FlashMessagePresentation type="success" message="操作が完了しました" />,
    );
    await expect(component.getByText("操作が完了しました")).toBeVisible();
  });

  // エラーメッセージが見える
  test("should allow me to see error message", async ({ mount }) => {
    const component = await mount(
      <FlashMessagePresentation type="error" message="エラーが発生しました" />,
    );
    await expect(component.getByText("エラーが発生しました")).toBeVisible();
  });

  // 情報メッセージが見える
  test("should allow me to see info message", async ({ mount }) => {
    const component = await mount(
      <FlashMessagePresentation type="info" message="情報メッセージ" />,
    );
    await expect(component.getByText("情報メッセージ")).toBeVisible();
  });

  // 警告メッセージが見える
  test("should allow me to see warning message", async ({ mount }) => {
    const component = await mount(
      <FlashMessagePresentation type="warning" message="警告メッセージ" />,
    );
    await expect(component.getByText("警告メッセージ")).toBeVisible();
  });
});
