import type { Page } from "@playwright/test";

import { setSession } from "@/tests/__helpers__/signin";

import {
  test,
  expect,
  http,
  HttpResponse,
  passthrough,
} from "@/tests/e2e/fixtures.msw";

const apiUrl = process.env.API_URL;

const publicReorderSangakuResponse = {
  data: {
    id: "1",
    type: "sangaku",
    attributes: {
      title: "guest_reorder_title",
      description: "guest_reorder_description",
      difficulty: "normal",
      kind: "reorder",
      inputs: [],
      author_name: "another_user",
      shrine_name: "test_shrine",
      code_blocks: [
        { id: 1, content: "puts 1" },
        { id: 2, content: "puts 2" },
        { id: 3, content: "puts 3" },
      ],
    },
    relationships: {
      user: { data: { id: "2", type: "user" } },
      shrine: { data: { id: "1", type: "shrine" } },
    },
  },
};

async function moveAllBlocksToAnswerArea(page: Page) {
  const moveToAnswerButton = page.getByRole("button", {
    name: "解答エリアへ移動",
  });
  await moveToAnswerButton.first().click();
  await moveToAnswerButton.first().click();
  await moveToAnswerButton.first().click();
  await expect(
    page.getByTestId("answer-blocks-area").getByTestId("drag-handle"),
  ).toHaveCount(3);
}

test.describe("/play/reorder/[id]", () => {
  test.describe("before signin", () => {
    test.use({
      mswHandlers: [
        [
          http.get(`${apiUrl}/up`, () => {
            return HttpResponse.json({ message: "success" });
          }),
          http.get(`${apiUrl}/api/v1/public/reorder_sangakus/1`, () => {
            return HttpResponse.json(publicReorderSangakuResponse, {
              status: 200,
            });
          }),
          http.post(`${apiUrl}/api/v1/public/reorder_sangakus/1/answer`, () => {
            return HttpResponse.json({ status: "correct" }, { status: 200 });
          }),
          // allow all non-mocked routes to pass through
          http.all("*", () => {
            return passthrough();
          }),
        ],
        { scope: "test" },
      ],
    });

    test("should allow me to see the title, description and all blocks in the unused area when visiting without signing in", async ({
      page,
    }) => {
      // Arrange
      // (ログインなし。セッション設定は行わない)

      // Act
      await page.goto("/play/reorder/1");

      // Assert
      await expect(page).toHaveURL("/play/reorder/1");
      await expect(
        page.getByRole("heading", { level: 1, name: "guest_reorder_title" }),
      ).toBeVisible();
      await expect(page.getByText("guest_reorder_description")).toBeVisible();
      const unusedBlocksArea = page.getByTestId("unused-blocks-area");
      // 利用しないエリアの初期並びはシャッフルされる（仕様）ため、順序は問わない
      await expect(unusedBlocksArea.getByTestId("block-item")).toHaveCount(3);
      await expect(unusedBlocksArea.getByText("puts 1")).toBeVisible();
      await expect(unusedBlocksArea.getByText("puts 2")).toBeVisible();
      await expect(unusedBlocksArea.getByText("puts 3")).toBeVisible();
      await expect(
        page.getByTestId("answer-blocks-area").getByTestId("drag-handle"),
      ).toHaveCount(0);
    });

    test("should allow me to see the correct result and the signin link on the same page when submitting an answer without signing in", async ({
      page,
    }) => {
      // Arrange
      let dialogCount = 0;
      page.on("dialog", async (dialog) => {
        dialogCount += 1;
        await dialog.dismiss();
      });
      await page.goto("/play/reorder/1");
      await expect(
        page.getByRole("heading", { level: 1, name: "guest_reorder_title" }),
      ).toBeVisible();
      await moveAllBlocksToAnswerArea(page);

      // Act
      await page.getByRole("button", { name: "解答を終了する" }).click();

      // Assert
      await expect(page.getByText("正解です！")).toBeVisible();
      await expect(
        page.getByRole("link", { name: "サインインして他の算額も解く" }),
      ).toBeVisible();
      await expect(page).toHaveURL("/play/reorder/1");
      expect(dialogCount).toBe(0);
    });

    test("should allow me to go to the signin page when clicking the signin link after answering as a guest", async ({
      page,
    }) => {
      // Arrange
      await page.goto("/play/reorder/1");
      await expect(
        page.getByRole("heading", { level: 1, name: "guest_reorder_title" }),
      ).toBeVisible();
      await moveAllBlocksToAnswerArea(page);
      await page.getByRole("button", { name: "解答を終了する" }).click();
      const signinLink = page.getByRole("link", {
        name: "サインインして他の算額も解く",
      });
      await expect(signinLink).toBeVisible();

      // Act
      await signinLink.click();

      // Assert
      await expect(page).toHaveURL(/\/signin/);
    });

    test.describe("metadata", () => {
      test("should allow me to see the title containing the sangaku title when visiting without signing in", async ({
        page,
      }) => {
        // Arrange
        // (ログインなし。既存の MSW ハンドラを利用)

        // Act
        await page.goto("/play/reorder/1");

        // Assert
        await expect(page).toHaveTitle(/guest_reorder_titleを解く/);
      });

      test("should allow me to see the meta description containing the sangaku description when visiting without signing in", async ({
        page,
      }) => {
        // Arrange
        // (ログインなし。既存の MSW ハンドラを利用)

        // Act
        await page.goto("/play/reorder/1");

        // Assert
        await expect(page.locator('meta[name="description"]')).toHaveAttribute(
          "content",
          /guest_reorder_description/,
        );
      });

      test("should allow me to see the og:title containing the sangaku title when visiting without signing in", async ({
        page,
      }) => {
        // Arrange
        // (ログインなし。既存の MSW ハンドラを利用)

        // Act
        await page.goto("/play/reorder/1");

        // Assert
        await expect(
          page.locator('meta[property="og:title"]'),
        ).toHaveAttribute("content", /guest_reorder_title/);
      });

      test("should allow me to see the og:description containing the sangaku description when visiting without signing in", async ({
        page,
      }) => {
        // Arrange
        // (ログインなし。既存の MSW ハンドラを利用)

        // Act
        await page.goto("/play/reorder/1");

        // Assert
        await expect(
          page.locator('meta[property="og:description"]'),
        ).toHaveAttribute("content", /guest_reorder_description/);
      });

      test("should allow me to see a non-empty og:image when visiting without signing in", async ({
        page,
      }) => {
        // Arrange
        // (ログインなし。既存の MSW ハンドラを利用)

        // Act
        await page.goto("/play/reorder/1");

        // Assert
        // 回帰ガード: 子ページの openGraph 定義で親の og:image が失われる誤実装を防ぐ
        await expect(
          page.locator('meta[property="og:image"]'),
        ).toHaveAttribute("content", /.+/);
      });
    });

    test.describe("when back returns 404", () => {
      test.use({
        mswHandlers: [
          [
            http.get(`${apiUrl}/up`, () => {
              return HttpResponse.json({ message: "success" });
            }),
            http.get(`${apiUrl}/api/v1/public/reorder_sangakus/2`, () => {
              return HttpResponse.json({ error: "Not Found" }, { status: 404 });
            }),
            // allow all non-mocked routes to pass through
            http.all("*", () => {
              return passthrough();
            }),
          ],
          { scope: "test" },
        ],
      });

      test("should allow me to be redirected to the signin page when visiting a non-representative reorder sangaku without signing in", async ({
        page,
      }) => {
        // Arrange
        // (ログインなし。back が 404 を返す)

        // Act
        await page.goto("/play/reorder/2");

        // Assert
        await expect(page).toHaveURL("/signin");
        await expect(
          page.getByRole("heading", { name: "サインイン" }),
        ).toBeVisible();
      });
    });
  });

  test.describe("after signin", () => {
    test.use({
      mswHandlers: [
        [
          http.get(`${apiUrl}/up`, () => {
            return HttpResponse.json({ message: "success" });
          }),
          http.get(`${apiUrl}/api/v1/public/reorder_sangakus/2`, () => {
            return HttpResponse.json({ error: "Not Found" }, { status: 404 });
          }),
          // allow all non-mocked routes to pass through
          http.all("*", () => {
            return passthrough();
          }),
        ],
        { scope: "test" },
      ],
    });

    test("should allow me to see the not found page without being redirected when visiting a non-representative reorder sangaku after signing in", async ({
      page,
    }) => {
      // Arrange
      await setSession(page);

      // Act
      await page.goto("/play/reorder/2");

      // Assert
      // 回帰ガード: ログイン済みユーザーが 404 時にサインインへリダイレクトされる誤実装を防ぐ
      await expect(page).toHaveURL("/play/reorder/2");
      await expect(
        page.getByRole("heading", { name: "This page could not be found." }),
      ).toBeVisible();
    });
  });
});
