import { Locator, Page } from "@playwright/test";
import { test, expect } from "@/tests/fixtures.ct";
import GuestReorderPuzzle from "@/app/ui/play/GuestReorderPuzzle";

const blocks = [
  { id: 1, content: "puts 1" },
  { id: 2, content: "puts 2" },
  { id: 3, content: "puts 3" },
];

const title = "並べ替え問題のタイトル";
const description = "これは並べ替え問題の問題文です";

const CTA_NAME = "サインインして他の算額も解く";

async function moveBlocksToAnswerArea(component: Locator, contents: string[]) {
  const unusedArea = component.getByTestId("unused-blocks-area");
  for (const content of contents) {
    await unusedArea
      .getByText(content)
      .getByRole("button", { name: "解答エリアへ移動" })
      .click();
  }
}

// モックの戻り値キューを設定する（mount 後、送信前に呼ぶ）
async function setGuestAnswerResponses(
  page: Page,
  responses: Array<{ status: "correct" | "incorrect" } | { error: string }>,
) {
  await page.evaluate((r) => {
    window.__guestAnswerResponses = r;
  }, responses);
}

test.describe("GuestReorderPuzzle", () => {
  test("should not allow me to see the result area or the sign-in CTA when the component is initially rendered", async ({
    mount,
  }) => {
    // Arrange & Act
    const component = await mount(
      <GuestReorderPuzzle
        sangakuId="1"
        blocks={blocks}
        title={title}
        description={description}
        isLoggedIn={false}
      />,
    );

    // Assert
    // role="status" は dnd-kit の DndContext がスクリーンリーダー向けに挿入する
    // 空の live region が常に1つ存在するため、件数ではなく結果の文言で判定する。
    await expect(component.getByText("正解です！", { exact: true })).toHaveCount(0);
    await expect(component.getByText("不正解です", { exact: true })).toHaveCount(0);
    await expect(component.getByRole("alert")).toHaveCount(0);
    await expect(component.getByRole("link", { name: CTA_NAME })).toHaveCount(
      0,
    );
  });

  test("should allow me to call submitGuestReorderAnswer with sangakuId and block_ids in answer area order when clicking the end-answer button", async ({
    mount,
    page,
  }) => {
    // Arrange
    page.on("dialog", (dialog) => dialog.accept());
    const component = await mount(
      <GuestReorderPuzzle
        sangakuId="1"
        blocks={blocks}
        title={title}
        description={description}
        isLoggedIn={false}
      />,
    );
    await moveBlocksToAnswerArea(component, ["puts 2", "puts 3", "puts 1"]);

    // Act
    await component.getByRole("button", { name: "解答を終了する" }).click();

    // Assert
    await expect
      .poll(() => page.evaluate(() => window.__guestAnswerCalls?.length ?? 0))
      .toBe(1);
    const calls = await page.evaluate(() => window.__guestAnswerCalls);
    expect(calls?.[0]).toEqual({ sangakuId: "1", blockIds: [2, 3, 1] });
  });

  test("should not allow me to see a confirm dialog when clicking the end-answer button", async ({
    mount,
    page,
  }) => {
    // Arrange
    const dialogMessages: string[] = [];
    page.on("dialog", async (dialog) => {
      dialogMessages.push(dialog.message());
      await dialog.accept();
    });
    const component = await mount(
      <GuestReorderPuzzle
        sangakuId="1"
        blocks={blocks}
        title={title}
        description={description}
        isLoggedIn={false}
      />,
    );
    await moveBlocksToAnswerArea(component, ["puts 2"]);

    // Act
    await component.getByRole("button", { name: "解答を終了する" }).click();

    // Assert
    await expect
      .poll(() => page.evaluate(() => window.__guestAnswerCalls?.length ?? 0))
      .toBe(1);
    expect(dialogMessages).toEqual([]);
  });

  test("should allow me to see the correct message and the sign-in CTA linking to /signin when the answer is correct and I am not logged in", async ({
    mount,
    page,
  }) => {
    // Arrange
    const component = await mount(
      <GuestReorderPuzzle
        sangakuId="1"
        blocks={blocks}
        title={title}
        description={description}
        isLoggedIn={false}
      />,
    );
    await setGuestAnswerResponses(page, [{ status: "correct" }]);
    await moveBlocksToAnswerArea(component, ["puts 1"]);

    // Act
    await component.getByRole("button", { name: "解答を終了する" }).click();

    // Assert
    await expect(
      component.getByRole("status").getByText("正解です！", { exact: true }),
    ).toBeVisible();
    const cta = component.getByRole("link", { name: CTA_NAME });
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute("href", "/signin");
  });

  test("should not allow me to see the sign-in CTA when the answer is correct and I am logged in", async ({
    mount,
    page,
  }) => {
    // Arrange
    const component = await mount(
      <GuestReorderPuzzle
        sangakuId="1"
        blocks={blocks}
        title={title}
        description={description}
        isLoggedIn={true}
      />,
    );
    await setGuestAnswerResponses(page, [{ status: "correct" }]);
    await moveBlocksToAnswerArea(component, ["puts 1"]);

    // Act
    await component.getByRole("button", { name: "解答を終了する" }).click();

    // Assert
    await expect(
      component.getByRole("status").getByText("正解です！", { exact: true }),
    ).toBeVisible();
    await expect(component.getByRole("link", { name: CTA_NAME })).toHaveCount(
      0,
    );
  });

  for (const isLoggedIn of [false, true]) {
    test(`should allow me to see the incorrect message without the sign-in CTA when the answer is incorrect and isLoggedIn is ${isLoggedIn}`, async ({
      mount,
      page,
    }) => {
      // Arrange
      const component = await mount(
        <GuestReorderPuzzle
          sangakuId="1"
          blocks={blocks}
          title={title}
          description={description}
          isLoggedIn={isLoggedIn}
        />,
      );
      await setGuestAnswerResponses(page, [{ status: "incorrect" }]);
      await moveBlocksToAnswerArea(component, ["puts 1"]);

      // Act
      await component.getByRole("button", { name: "解答を終了する" }).click();

      // Assert
      await expect(
        component.getByRole("status").getByText("不正解です", { exact: true }),
      ).toBeVisible();
      await expect(
        component.getByRole("link", { name: CTA_NAME }),
      ).toHaveCount(0);
    });
  }

  test("should allow me to resubmit with the changed order when the answer is incorrect and I reorder the answer area", async ({
    mount,
    page,
  }) => {
    // Arrange
    const component = await mount(
      <GuestReorderPuzzle
        sangakuId="1"
        blocks={blocks}
        title={title}
        description={description}
        isLoggedIn={false}
      />,
    );
    await setGuestAnswerResponses(page, [
      { status: "incorrect" },
      { status: "correct" },
    ]);
    await moveBlocksToAnswerArea(component, ["puts 1", "puts 2", "puts 3"]);
    const answerArea = component.getByTestId("answer-blocks-area");
    await component.getByRole("button", { name: "解答を終了する" }).click();
    await expect(
      component.getByRole("status").getByText("不正解です", { exact: true }),
    ).toBeVisible();

    // Act
    // 1回目の送信後も解答エリアの並びは保持されている前提で、puts 2 を「上へ」移動する
    await answerArea
      .getByText("puts 2")
      .getByRole("button", { name: "上へ" })
      .click();
    await component.getByRole("button", { name: "解答を終了する" }).click();

    // Assert
    await expect
      .poll(() => page.evaluate(() => window.__guestAnswerCalls?.length ?? 0))
      .toBe(2);
    const calls = await page.evaluate(() => window.__guestAnswerCalls);
    expect(calls?.[0].blockIds).toEqual([1, 2, 3]);
    expect(calls?.[1].blockIds).toEqual([2, 1, 3]);
  });

  test("should allow me to see the error message in the alert area without the sign-in CTA when the server action returns an error", async ({
    mount,
    page,
  }) => {
    // Arrange
    const component = await mount(
      <GuestReorderPuzzle
        sangakuId="1"
        blocks={blocks}
        title={title}
        description={description}
        isLoggedIn={false}
      />,
    );
    await setGuestAnswerResponses(page, [{ error: "送信に失敗しました" }]);
    await moveBlocksToAnswerArea(component, ["puts 1"]);

    // Act
    await component.getByRole("button", { name: "解答を終了する" }).click();

    // Assert
    await expect(
      component
        .getByRole("alert")
        .getByText("送信に失敗しました", { exact: true }),
    ).toBeVisible();
    await expect(component.getByRole("link", { name: CTA_NAME })).toHaveCount(
      0,
    );
  });
});
