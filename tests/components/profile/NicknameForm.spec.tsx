import { test, expect } from "@/tests/fixtures.ct";
import NicknameForm from "@/app/ui/profile/NicknameForm";

test.describe("NicknameForm", () => {
  test("should allow me to see the initial nickname in the text field", async ({ mount }) => {
    const component = await mount(<NicknameForm nickname="test nickname" />);
    const textbox = component.getByRole("textbox", { name: "ニックネーム" });
    await expect(textbox).toBeVisible();
    await expect(textbox).toHaveValue("test nickname");
  });

  test("should allow me to submit the form and see the nickname fall back to prop value", async ({ mount }) => {
    // updateProfile モックは {} を返す（state.values が undefined）ので
    // state.values?.nickname ?? nickname の ?? 右辺（nickname prop）が使われる
    const component = await mount(<NicknameForm nickname="test nickname" />);
    const textbox = component.getByRole("textbox", { name: "ニックネーム" });
    await textbox.fill("changed");
    await component.getByRole("button", { name: "保存" }).click();
    // フォーム送信後、state.values が undefined のため nickname prop にフォールバック
    await expect(textbox).toHaveValue("test nickname", { timeout: 5000 });
  });
});
