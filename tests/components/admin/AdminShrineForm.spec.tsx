import { test, expect } from "@/tests/fixtures.ct";
import AdminShrineForm from "@/app/ui/admin/AdminShrineForm";
import { SUBMIT_FAILURE_MESSAGE_TEXT } from "@/tests/__helpers__/submit-failure";

// AdminShrineForm（作成モード）
test.describe("AdminShrineForm (create mode)", () => {
  // 名前の入力欄がある
  test("should have name input", async ({ mount }) => {
    const component = await mount(<AdminShrineForm />);
    await expect(component.getByLabel("神社名")).toBeVisible();
  });

  // 住所の入力欄がある
  test("should have address input", async ({ mount }) => {
    const component = await mount(<AdminShrineForm />);
    await expect(component.getByLabel("住所")).toBeVisible();
  });

  // 緯度の入力欄がある
  test("should have latitude input", async ({ mount }) => {
    const component = await mount(<AdminShrineForm />);
    await expect(component.getByLabel("緯度")).toBeVisible();
  });

  // 経度の入力欄がある
  test("should have longitude input", async ({ mount }) => {
    const component = await mount(<AdminShrineForm />);
    await expect(component.getByLabel("経度")).toBeVisible();
  });

  // place_id の入力欄がある
  test("should have place_id input", async ({ mount }) => {
    const component = await mount(<AdminShrineForm />);
    await expect(component.getByLabel("Place ID")).toBeVisible();
  });

  // 送信ボタンがある
  test("should have submit button", async ({ mount }) => {
    const component = await mount(<AdminShrineForm />);
    await expect(component.getByRole("button", { name: "作成" })).toBeVisible();
  });
});

// AdminShrineForm（編集モード）
test.describe("AdminShrineForm (edit mode)", () => {
  const shrine = {
    id: "1",
    type: "shrine" as const,
    attributes: {
      name: "既存の神社",
      address: "東京都千代田区1-1",
      latitude: 35.681236,
      longitude: 139.767125,
      sangaku_count: 2,
    },
  };

  // 既存の神社データで名前が入力済みになっている
  test("should pre-fill name with existing shrine data", async ({ mount }) => {
    const component = await mount(<AdminShrineForm shrine={shrine} />);
    await expect(component.getByLabel("神社名")).toHaveValue("既存の神社");
  });

  // ラベルが「更新」の送信ボタンがある
  test("should have submit button labeled as update", async ({ mount }) => {
    const component = await mount(<AdminShrineForm shrine={shrine} />);
    await expect(component.getByRole("button", { name: "更新" })).toBeVisible();
  });

  // 送信中に 更新 ボタンをダブルクリックしても、二重送信できない
  test("should not allow me to submit twice when I double-click the 更新 button while sending", async ({
    mount,
    page,
  }) => {
    // Arrange
    await mount(<AdminShrineForm shrine={shrine} />, {
      hooksConfig: { actionHold: true },
    });
    const button = page.getByRole("button", { name: "更新" });

    // Act
    await button.dblclick();

    // Assert
    await expect(button).toBeDisabled();
    await page.evaluate(() => window.__releaseActions?.());
    await expect(button).toBeEnabled();
    const calls = await page.evaluate(
      () => window.__actionCalls?.updateShrine ?? 0,
    );
    expect(calls).toBe(1);
  });

  // リクエストが失敗したとき、失敗メッセージが見える
  test("should allow me to see the failure message when the request fails", async ({
    mount,
    page,
  }) => {
    // Arrange
    await mount(<AdminShrineForm shrine={shrine} />, {
      hooksConfig: { actionRejectCount: 1 },
    });

    // Act
    await page.getByRole("button", { name: "更新" }).click();

    // Assert
    await expect(page.getByTestId("flash-message")).toHaveText(
      SUBMIT_FAILURE_MESSAGE_TEXT,
    );
  });
});
