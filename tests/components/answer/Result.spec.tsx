import { test, expect } from "@/tests/fixtures.ct";
import Result from "@/app/ui/answer/Result";

test.describe("Result", () => {
  test("should allow me to see the result output after polling completes", async ({ mount }) => {
    const component = await mount(<Result index={0} id="1" />);
    // モックが即座に correct を返すのでポーリングが完了する
    await expect(component.getByTestId("result-1")).toBeVisible({ timeout: 5000 });
    await expect(component.getByText("○")).toBeVisible();
  });

  test("should allow me to see the correct index number", async ({ mount }) => {
    const component = await mount(<Result index={2} id="1" />);
    await expect(component.getByText("3")).toBeVisible({ timeout: 5000 });
  });
});
