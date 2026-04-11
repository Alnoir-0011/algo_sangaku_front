import { test, expect } from "@playwright/experimental-ct-react";
import { useState } from "react";
import FixedInputField from "@/app/ui/sangaku/FixedInputField";

function FixedInputFieldWrapper({ initial }: { initial: string[] }) {
  const [fixedInputs, setFixedInputs] = useState(initial);
  return (
    <FixedInputField
      fixedInputs={fixedInputs}
      setFixedInputs={setFixedInputs}
    />
  );
}

test.describe("FixedInputField", () => {
  test("renders input fields", async ({ mount }) => {
    const component = await mount(
      <FixedInputFieldWrapper initial={["入力1", "入力2"]} />,
    );
    await expect(component.getByLabel("fixedInput-1")).toBeVisible();
    await expect(component.getByLabel("fixedInput-2")).toBeVisible();
  });

  test("shows index numbers", async ({ mount }) => {
    const component = await mount(
      <FixedInputFieldWrapper initial={["a", "b"]} />,
    );
    await expect(component.getByText("1")).toBeVisible();
    await expect(component.getByText("2")).toBeVisible();
  });

  test("has add button", async ({ mount }) => {
    const component = await mount(<FixedInputFieldWrapper initial={[]} />);
    await expect(
      component.getByRole("button", { name: "addButton" }),
    ).toBeVisible();
  });

  test("has remove buttons for each field", async ({ mount }) => {
    const component = await mount(
      <FixedInputFieldWrapper initial={["a", "b"]} />,
    );
    const deleteButtons = component.getByRole("button", { name: "削除" });
    await expect(deleteButtons).toHaveCount(2);
  });

  test("adds a new field when add button is clicked", async ({
    mount,
    page,
  }) => {
    await mount(<FixedInputFieldWrapper initial={["a"]} />);
    await page.getByRole("button", { name: "addButton" }).click();
    await expect(page.getByLabel("fixedInput-2")).toBeVisible();
  });

  test("removes a field when delete button is clicked", async ({
    mount,
    page,
  }) => {
    await mount(<FixedInputFieldWrapper initial={["a", "b"]} />);
    await page.getByRole("button", { name: "削除" }).first().click();
    await expect(page.getByLabel("fixedInput-1")).toBeVisible();
    await expect(page.getByLabel("fixedInput-2")).not.toBeVisible();
  });
});
