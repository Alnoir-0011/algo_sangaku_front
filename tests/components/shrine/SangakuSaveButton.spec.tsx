import { test, expect } from "@/tests/fixtures.ct";
import { SangakuSaveButton } from "@/app/ui/shrine/sangakus/SangakuSaveButton";

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
});
