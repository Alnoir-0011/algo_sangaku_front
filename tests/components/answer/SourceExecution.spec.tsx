import { test, expect } from "@/tests/fixtures.ct";
import SourceExecution from "@/app/ui/answer/SourceExecution";

// SourceExecution コンポーネント
test.describe("SourceExecution", () => {
  // 出力欄の初期プレースホルダーが見える
  test("should allow me to see initial output placeholder", async ({ mount }) => {
    const component = await mount(<SourceExecution source="puts 'hello'" />);
    await expect(component.getByText("出力がこちらに表示されます。")).toBeVisible();
  });

  // 入力欄に入力できる
  test("should allow me to type in the input field", async ({ mount }) => {
    const component = await mount(<SourceExecution source="puts 'hello'" />);
    await component.getByLabel("入力").fill("test input");
    await expect(component.getByLabel("入力")).toHaveValue("test input");
  });

  // 実行ボタンをクリックすると、モックの出力が見える
  test("should allow me to see mock output after clicking the run button", async ({ mount }) => {
    const component = await mount(<SourceExecution source="puts 'hello'" />);
    await component.getByRole("button", { name: "実行" }).click();
    await expect(component.getByText("mock output")).toBeVisible({ timeout: 5000 });
  });
});
