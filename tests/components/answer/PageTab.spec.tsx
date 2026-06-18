import { test, expect } from "@/tests/fixtures.ct";
import PageTab from "@/app/ui/answer/PageTab";

test.describe("PageTab", () => {
  test("should allow me to see both tabs", async ({ mount }) => {
    const component = await mount(<PageTab />);
    await expect(component.getByRole("tab", { name: "未解答" })).toBeVisible();
    await expect(component.getByRole("tab", { name: "解答済み" })).toBeVisible();
  });

  test("should allow me to switch to answered tab by clicking", async ({ mount }) => {
    const component = await mount(<PageTab />);
    const answeredTab = component.getByRole("tab", { name: "解答済み" });
    await answeredTab.click();
    await expect(answeredTab).toHaveAttribute("aria-selected", "true");
  });
});
