import { test, expect } from "@/tests/fixtures.ct";
import SourceExecution from "@/app/ui/answer/SourceExecution";

test.describe("SourceExecution", () => {
  test("should allow me to see initial output placeholder", async ({ mount }) => {
    const component = await mount(<SourceExecution source="puts 'hello'" />);
    await expect(component.getByText("出力がこちらに表示されます。")).toBeVisible();
  });

  test("should allow me to type in the input field", async ({ mount }) => {
    const component = await mount(<SourceExecution source="puts 'hello'" />);
    await component.getByLabel("入力").fill("test input");
    await expect(component.getByLabel("入力")).toHaveValue("test input");
  });

  test("should allow me to see mock output after clicking the run button", async ({ mount }) => {
    const component = await mount(<SourceExecution source="puts 'hello'" />);
    await component.getByRole("button", { name: "実行" }).click();
    await expect(component.getByText("mock output")).toBeVisible({ timeout: 5000 });
  });
});
