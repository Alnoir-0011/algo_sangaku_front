import { test, expect } from "@/tests/fixtures.ct";
import { FixedInputFieldWrapper } from "./FixedInputFieldStories";

test.describe("FixedInputField", () => {
  test("should allow me to see input fields", async ({ mount }) => {
    const component = await mount(
      <FixedInputFieldWrapper initial={["入力1", "入力2"]} />,
    );
    await expect(component.getByLabel("fixedInput-1")).toBeVisible();
    await expect(component.getByLabel("fixedInput-2")).toBeVisible();
  });

  test("should allow me to see index numbers for each field", async ({ mount }) => {
    const component = await mount(
      <FixedInputFieldWrapper initial={["a", "b"]} />,
    );
    await expect(component.getByText("1")).toBeVisible();
    await expect(component.getByText("2")).toBeVisible();
  });

  test("should allow me to see add button", async ({ mount }) => {
    const component = await mount(<FixedInputFieldWrapper initial={[]} />);
    await expect(
      component.getByRole("button", { name: "固定入力を追加" }),
    ).toBeVisible();
  });

  test("should allow me to see remove buttons for each field", async ({ mount }) => {
    const component = await mount(
      <FixedInputFieldWrapper initial={["a", "b"]} />,
    );
    const deleteButtons = component.getByRole("button", { name: "削除" });
    await expect(deleteButtons).toHaveCount(2);
  });

  test("should allow me to add a new field by clicking add button", async ({
    mount,
    page,
  }) => {
    await mount(<FixedInputFieldWrapper initial={["a"]} />);
    await page.getByRole("button", { name: "固定入力を追加" }).click();
    await expect(page.getByLabel("fixedInput-2")).toBeVisible();
  });

  test("should allow me to remove a field by clicking delete button", async ({
    mount,
    page,
  }) => {
    await mount(<FixedInputFieldWrapper initial={["a", "b"]} />);
    await page.getByRole("button", { name: "削除" }).first().click();
    await expect(page.getByLabel("fixedInput-1")).toBeVisible();
    await expect(page.getByLabel("fixedInput-2")).not.toBeVisible();
  });
});
