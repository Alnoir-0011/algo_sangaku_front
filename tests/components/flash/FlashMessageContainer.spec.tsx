import { test, expect } from "@/tests/fixtures.ct";
import FlashMessageContainer from "@/app/ui/flash/FlashMessageContainer";

// consumeFlash は @/app/lib/actions/flash ごと playwright-ct.config.ts の Vite alias で
// tests/__mocks__/actions/flash.ts に差し替えられる。返すフラッシュと reject する回数は、
// hooksConfig（playwright/index.tsx）から設定する。

test.describe("FlashMessageContainer", () => {
  test("should allow me to see the flash message that is consumed", async ({
    mount,
    page,
  }) => {
    await mount(<FlashMessageContainer refreshKey={1} />, {
      hooksConfig: {
        consumeFlashQueue: [{ type: "success", message: "保存しました" }],
      },
    });

    await expect(page.getByTestId("flash-message")).toContainText("保存しました");
  });

  test("should not allow me to see a flash message when there is nothing to consume", async ({
    mount,
    page,
  }) => {
    await mount(<FlashMessageContainer refreshKey={1} />);

    await expect(page.getByTestId("flash-message")).toHaveCount(0);
  });

  test("should not allow me to see a flash message and should allow the error to be logged when consuming fails", async ({
    mount,
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });

    await mount(<FlashMessageContainer refreshKey={1} />, {
      hooksConfig: { consumeFlashRejectCount: 1 },
    });

    await expect
      .poll(() =>
        consoleErrors.some((text) =>
          text.includes("Error in FlashMessage component:"),
        ),
      )
      .toBe(true);
    await expect(page.getByTestId("flash-message")).toHaveCount(0);
  });

  test("should allow me to see the next flash message when the refresh key changes", async ({
    mount,
    page,
  }) => {
    const component = await mount(<FlashMessageContainer refreshKey={1} />, {
      hooksConfig: {
        consumeFlashQueue: [
          { type: "success", message: "1 件目" },
          { type: "error", message: "2 件目" },
        ],
      },
    });
    await expect(page.getByTestId("flash-message")).toContainText("1 件目");

    await component.update(<FlashMessageContainer refreshKey={2} />);

    await expect(page.getByTestId("flash-message")).toContainText("2 件目");
    await expect(page.getByTestId("flash-message")).toHaveCount(1);
  });

  // 同じ文言が続けて来ても、前のものを閉じていれば、新しいものが表示される（key で作り直す）。
  test("should allow me to see the same flash message again after I closed it when the refresh key changes", async ({
    mount,
    page,
  }) => {
    const flash = { type: "info", message: "同じ文言" } as const;
    const component = await mount(<FlashMessageContainer refreshKey={1} />, {
      hooksConfig: { consumeFlashQueue: [flash, flash] },
    });
    await page.getByTestId("flash-message").getByRole("button").click();
    await expect(page.getByTestId("flash-message")).toHaveCount(0);

    await component.update(<FlashMessageContainer refreshKey={2} />);

    await expect(page.getByTestId("flash-message")).toContainText("同じ文言");
  });

  // consumeFlash は cookie を消す破壊的な読み出しで、結果を捨てると二度と取り戻せない。
  // 応答が届く前に refreshKey が変わっても（Server Action が cookie を消すと、サーバー描画が
  // やり直されて Date.now() が変わる）、先に消費されたフラッシュは表示される。
  test("should allow me to see the flash message that was consumed before the refresh key changed", async ({
    mount,
    page,
  }) => {
    const component = await mount(<FlashMessageContainer refreshKey={1} />, {
      hooksConfig: {
        consumeFlashQueue: [{ type: "success", message: "サインインしました" }],
        consumeFlashDelaysMs: [300],
      },
    });

    // 1 回目の応答を待たずに、2 回目の取得（応答はすぐ返り、中身は空）を起こす
    await component.update(<FlashMessageContainer refreshKey={2} />);

    await expect(page.getByTestId("flash-message")).toContainText(
      "サインインしました",
    );
  });
});
