import { setSession } from "../__helpers__/signin";
import { waitForMonacoEditor } from "../__helpers__/hydration";

import {
  test,
  expect,
  http,
  HttpResponse,
  passthrough,
} from "@/tests/e2e/fixtures.msw";

// reorder形式のsangaku作成における「形式選択→reorder作成フォーム→確認画面→保存」の
// 一気通貫のE2Eシナリオを検証する。
// 各画面単体の詳細な機能検証は tests/e2e/sangakus/create/page.spec.ts でカバー済みのため、
// ここでは画面間の実際の遷移（リンク・ナビゲーション）が繋がっていることに主眼を置く。
const apiUrl = process.env.API_URL;

test.describe("reorder sangaku full creation flow", () => {
  test.use({
    mswHandlers: [
      [
        http.get(`${apiUrl}/up`, () => {
          return HttpResponse.json({
            message: "success",
          });
        }),
        http.get(`${apiUrl}/api/v1/user/code_sangakus/generate_source_usage`, () => {
          return HttpResponse.json(
            { used: 0, limit: 5, remaining: 5, reset_at: "2026-04-12T18:00:00Z" },
            { status: 200 },
          );
        }),
        // allow all non-mocked routes to pass through
        http.all("*", () => {
          return passthrough();
        }),
      ],
      { scope: "test" }, // or 'worker'
    ],
  });

  test("should allow me to complete the full reorder sangaku creation flow when starting from kind selection", async ({
    page,
    msw,
  }) => {
    // Arrange
    const backendResponse = {
      data: {
        id: "1",
        type: "sangaku",
        attributes: {
          title: "test_title",
          description: "test_description",
          difficulty: "normal",
          kind: "reorder",
          source: null,
          inputs: [],
          author_name: "test",
          shrine_name: null,
          code_blocks: [],
        },
        relationships: { user: { data: { id: "1", type: "user" } }, shrine: { data: null } },
      },
    };
    msw.use(
      http.post(`${apiUrl}/api/v1/user/reorder_sangakus`, () => {
        return HttpResponse.json(backendResponse, { status: 200 });
      }),
    );
    await setSession(page);
    await page.goto("/sangakus/create");

    // Act: 形式選択画面からreorderを選んでフォームへ遷移する
    const reorderLink = page.getByRole("link", { name: "並べ替え形式で作成" });
    await expect(reorderLink).toBeVisible();
    await reorderLink.click();
    await expect(page).toHaveURL(/\?kind=reorder/);

    // Act: reorder作成フォームへの入力とブロック生成
    await expect(page.getByLabel("タイトル")).toBeVisible();
    await page.getByLabel("タイトル").fill("test_title");
    await page.getByLabel("問題文").fill("test_description");
    await waitForMonacoEditor(page, 0, "monaco-editor-block-input");
    await page
      .getByTestId("monaco-editor-block-input")
      .locator(".monaco-editor")
      .click();
    await page.keyboard.type("puts 1");
    await page.keyboard.press("Enter");
    await page.keyboard.type("puts 2");
    await page.getByRole("button", { name: "行分割して生成" }).click();

    // Act: 確認画面への遷移
    await page.getByRole("button", { name: "確認画面へ" }).click();
    const checkModal = page.getByTestId("reorder-check-page-modal");
    await expect(checkModal).toBeVisible();

    // Act: 保存を確定する
    await page.getByRole("button", { name: "保存する" }).click();

    // Assert: 保存成功後に遷移先ページでフラッシュメッセージが確認できる
    await expect(page).toHaveURL("/");
    const flash = page.getByTestId("flash-message");
    await expect(flash).toBeVisible({ timeout: 10_000 });
    await expect(flash).toContainText("算額を作成しました");
  });

  test.describe("reorder sangaku dedication", () => {
    test.use({
      geolocation: { latitude: 35.70204829610801, longitude: 139.76789333814216 },
      permissions: ["geolocation"],
    });

    test("should allow me to dedicate a saved reorder sangaku to a shrine when confirming reorder blocks in the modal", async ({
      page,
      msw,
    }) => {
      // Arrange
      msw.use(
        http.get(`${apiUrl}/api/v1/shrines/1`, () => {
          return HttpResponse.json(
            {
              data: {
                id: "1",
                type: "shrine",
                attributes: {
                  name: "test_shrine",
                  address: "test_address",
                  latitude: 35.70204829610801,
                  longitude: 139.76789333814216,
                  place_id: "test_place_id_1",
                },
              },
            },
            { status: 200 },
          );
        }),
        http.get(`${apiUrl}/api/v1/user/sangakus`, () => {
          return HttpResponse.json(
            {
              data: [
                {
                  id: "1",
                  type: "sangaku",
                  attributes: {
                    title: "reorder_before_dedicate",
                    description: "reorder_test_description",
                    difficulty: "easy",
                    inputs: [],
                    author_name: "test",
                    kind: "reorder",
                  },
                  relationships: {
                    user: { data: { id: "1", type: "user" } },
                    shrine: { data: null },
                  },
                },
              ],
            },
            { status: 200, headers: { "total-pages": "1" } },
          );
        }),
        http.get(`${apiUrl}/api/v1/user/sangakus/1`, () => {
          return HttpResponse.json(
            {
              data: {
                id: "1",
                type: "sangaku",
                attributes: {
                  title: "reorder_before_dedicate",
                  description: "reorder_test_description",
                  difficulty: "easy",
                  inputs: [],
                  author_name: "test",
                  kind: "reorder",
                  code_blocks: [
                    { id: 1, content: "puts 1", correct_position: 1 },
                    { id: 2, content: "puts 2", correct_position: 2 },
                    { id: 3, content: "puts 999", correct_position: null },
                  ],
                },
                relationships: {
                  user: { data: { id: "1", type: "user" } },
                  shrine: { data: null },
                },
              },
            },
            { status: 200 },
          );
        }),
        http.post(`${apiUrl}/api/v1/user/sangakus/1/dedicate`, () => {
          return HttpResponse.json(
            {
              data: {
                id: "1",
                type: "sangaku",
                attributes: {
                  title: "reorder_before_dedicate",
                  description: "reorder_test_description",
                  difficulty: "easy",
                  inputs: [],
                  author_name: "test",
                  kind: "reorder",
                },
                relationships: {
                  user: { data: { id: "1", type: "user" } },
                  shrine: { data: { id: "1", type: "shrine" } },
                },
              },
            },
            { status: 200 },
          );
        }),
      );
      await setSession(page);

      // Act: 自分が作成した未奉納のreorder形式算額があるページへアクセスし、
      // 奉納確認モーダルを開く
      await page.goto("/shrines/1/dedicate");
      const sangaku = page.getByRole("heading", {
        name: "reorder_before_dedicate",
      });
      await sangaku.click();
      const modal = page.getByRole("dialog");
      const heading = modal.getByRole("heading", {
        name: "reorder_before_dedicate",
      });
      await expect(heading).toBeVisible();

      // Assert: reorder形式らしい表示（正解順ブロック・ダミーブロックの区別）を確認する
      const firstBlock = modal.getByTestId("confirm-modal-code-block-1");
      await expect(firstBlock).toBeVisible();
      await expect(firstBlock).toContainText("1");
      await expect(firstBlock).toContainText("puts 1");
      const secondBlock = modal.getByTestId("confirm-modal-code-block-2");
      await expect(secondBlock).toContainText("2");
      await expect(secondBlock).toContainText("puts 2");
      const dummyBlock = modal.getByTestId("confirm-modal-code-block-3");
      await expect(dummyBlock).toContainText("ダミー");
      await expect(dummyBlock).toContainText("puts 999");

      // Assert: コード表示欄（code形式専用のMonacoエディタ・解答チェック用入力）が出ないこと
      await expect(page.locator(".monaco-editor")).toHaveCount(0);
      await expect(modal.getByText("解答チェック用入力")).toHaveCount(0);

      // Act: 奉納を確定する
      const button = modal.getByRole("button", { name: "この算額を奉納する" });
      await button.click();

      // Assert: 奉納成功のフラッシュメッセージが表示される
      const flash = page.getByTestId("flash-message");
      await expect(flash).toBeVisible({ timeout: 10_000 });
      await expect(flash).toContainText("算額を奉納しました");
    });
  });

  test("should allow me to see code and reorder sangakus together with correct kind badges and save the reorder sangaku when the shrine sangaku list contains mixed kinds", async ({
    page,
    msw,
  }) => {
    // Arrange
    msw.use(
      http.get(`${apiUrl}/api/v1/shrines/1`, () => {
        return HttpResponse.json(
          {
            data: {
              id: "1",
              type: "shrine",
              attributes: {
                name: "test_shrine",
                address: "test_address",
                latitude: 35.70204829610801,
                longitude: 139.76789333814216,
                place_id: "test_place_id_1",
              },
            },
          },
          { status: 200 },
        );
      }),
      http.get(`${apiUrl}/api/v1/shrines/1/sangakus`, () => {
        return HttpResponse.json(
          {
            data: [
              {
                id: "1",
                type: "sangaku",
                attributes: {
                  title: "code_sangaku_title",
                  description: "code_sangaku_description",
                  source: "puts 'Hello world'",
                  difficulty: "normal",
                  inputs: [],
                  kind: "code",
                },
                relationships: {
                  user: { data: { id: "2", type: "user" } },
                  shrine: { data: { id: "1", type: "shrine" } },
                },
              },
              {
                id: "2",
                type: "sangaku",
                attributes: {
                  title: "reorder_sangaku_title",
                  description: "reorder_sangaku_description",
                  source: null,
                  difficulty: "normal",
                  inputs: [],
                  kind: "reorder",
                },
                relationships: {
                  user: { data: { id: "2", type: "user" } },
                  shrine: { data: { id: "1", type: "shrine" } },
                },
              },
            ],
          },
          { status: 200, headers: { "total-pages": "1" } },
        );
      }),
      http.get(`${apiUrl}/api/v1/user/saved_sangaku_ids`, () => {
        return HttpResponse.json({ saved_sangaku_ids: [] }, { status: 200 });
      }),
      http.post(`${apiUrl}/api/v1/sangakus/2/save`, () => {
        return HttpResponse.json(
          {
            data: {
              id: "2",
              type: "sangaku",
              attributes: {
                title: "reorder_sangaku_title",
                description: "reorder_sangaku_description",
                source: null,
                difficulty: "normal",
                inputs: [],
                kind: "reorder",
              },
              relationships: {
                user: { data: { id: "2", type: "user" } },
                shrine: { data: { id: "1", type: "shrine" } },
              },
            },
          },
          { status: 200 },
        );
      }),
    );
    await setSession(page);

    // Act: 神社の算額一覧ページへアクセスする
    await page.goto("/shrines/1/sangakus");

    // Assert: code形式・reorder形式のカードがそれぞれ表示され、正しい形式バッジが付いている
    const codeTitle = page.getByRole("heading", {
      name: "code_sangaku_title",
    });
    await expect(codeTitle).toBeVisible();
    await expect(
      codeTitle.locator("xpath=..").getByText("コード記述"),
    ).toBeVisible();

    const reorderTitle = page.getByRole("heading", {
      name: "reorder_sangaku_title",
    });
    await expect(reorderTitle).toBeVisible();
    await expect(
      reorderTitle.locator("xpath=..").getByText("並べ替え"),
    ).toBeVisible();

    // Act: reorder形式のカードの保存ボタンをクリックする
    // 一覧はレスポンス順（code→reorder）で描画されるため、2件目のボタンがreorder形式のものになる
    const saveButtons = page.getByRole("button", { name: "算額を写す" });
    await saveButtons.nth(1).click();

    // Assert: 保存成功のフラッシュメッセージが表示され、reorder形式のボタンが「保存済み」に変わる
    const flash = page.getByTestId("flash-message");
    await expect(flash).toBeVisible({ timeout: 10_000 });
    await expect(flash).toContainText("算額の写しを作成しました");
    const savedButtons = page.getByRole("button", { name: "保存済み" });
    await expect(savedButtons).toHaveCount(1);
    await expect(savedButtons.first()).toBeDisabled();
  });

  test("should allow me to see the correct result when answering a saved reorder sangaku in the correct order", async ({
    page,
    msw,
  }) => {
    // Arrange
    msw.use(
      http.get(`${apiUrl}/api/v1/user/saved_sangakus/3`, () => {
        return HttpResponse.json(
          {
            data: {
              id: "3",
              type: "sangaku",
              attributes: {
                title: "reorder_answer_title",
                description: "reorder_answer_description",
                difficulty: "normal",
                inputs: [],
                author_name: "another_user",
                kind: "reorder",
                code_blocks: [
                  { id: 1, content: "block1" },
                  { id: 2, content: "block2" },
                  { id: 3, content: "block3" },
                ],
              },
              relationships: {
                user: { data: { id: "2", type: "user" } },
                shrine: { data: { id: "1", type: "shrine" } },
              },
            },
          },
          { status: 200 },
        );
      }),
      http.post(`${apiUrl}/api/v1/user/saved_sangakus/3/answer`, () => {
        return HttpResponse.json(
          {
            data: {
              id: "3",
              type: "answer",
              attributes: {
                source: null,
                status: "correct",
                kind: "reorder",
              },
              relationships: {
                user_sangaku_save: { data: { id: "3", type: "user_sangaku_save" } },
                answer_results: { data: [] },
              },
            },
          },
          { status: 200 },
        );
      }),
      http.get(`${apiUrl}/api/v1/user/saved_sangakus/3/answer`, () => {
        return HttpResponse.json(
          {
            data: {
              id: "3",
              type: "answer",
              attributes: {
                source: null,
                status: "correct",
                kind: "reorder",
              },
              relationships: {
                user_sangaku_save: { data: { id: "3", type: "user_sangaku_save" } },
                answer_results: { data: [] },
              },
            },
          },
          { status: 200 },
        );
      }),
      http.get(`${apiUrl}/api/v1/user/answers/3`, () => {
        return HttpResponse.json(
          {
            data: {
              id: "3",
              type: "answer",
              attributes: {
                source: null,
                status: "correct",
                kind: "reorder",
              },
              relationships: {
                user_sangaku_save: { data: { id: "3", type: "user_sangaku_save" } },
                answer_results: { data: [] },
              },
            },
          },
          { status: 200 },
        );
      }),
    );
    await setSession(page);

    // Act: 保存済みreorder算額の解答画面へアクセスする
    await page.goto("/saved_sangakus/3/answer/create");
    const title = page.getByRole("heading", { name: "reorder_answer_title" });
    await expect(title).toBeVisible();
    const unusedBlocksArea = page.getByTestId("unused-blocks-area");
    await expect(unusedBlocksArea).toBeVisible();

    // Act: 全ブロックを正しい順序（block1→block2→block3）で解答エリアへ移動する
    const moveToAnswerButton = page.getByRole("button", {
      name: "解答エリアへ移動",
    });
    await moveToAnswerButton.first().click();
    await moveToAnswerButton.first().click();
    await moveToAnswerButton.first().click();
    await expect(page.getByTestId("unused-blocks-area").getByTestId("drag-handle")).toHaveCount(0);
    const answerBlocksArea = page.getByTestId("answer-blocks-area");
    await expect(answerBlocksArea.getByTestId("drag-handle")).toHaveCount(3);

    // Act: 解答を終了する
    const submitButton = page.getByRole("button", { name: "解答を終了する" });
    page.once("dialog", async (dialog) => {
      await dialog.accept();
    });
    await submitButton.click();

    // Assert: 結果ページへリダイレクトされ、正解（明察）が表示される
    await expect(page).toHaveURL("/saved_sangakus/3/answer");
    const resultHeading = page.getByRole("heading", {
      name: "reorder_answer_titleの結果",
    });
    await expect(resultHeading).toBeVisible();
    await expect(page.getByText("明察")).toBeVisible();
  });

  test("should allow me to see the correct result when answering a saved reorder sangaku that includes a dummy block excluded from the answer area", async ({
    page,
    msw,
  }) => {
    // Arrange
    // ダミーブロック（正解順序に含まれないブロック）が混在していても、
    // 正解ブロックのみを正しい順序で解答エリアへ移動すれば正解になる
    // （受入条件の中核）ことを検証する。back（モック）の判定ロジック自体は
    // 対象外で、フロントが「利用しないエリアにダミーが残っていても送信できる」
    // ことを確認する。
    msw.use(
      http.get(`${apiUrl}/api/v1/user/saved_sangakus/5`, () => {
        return HttpResponse.json(
          {
            data: {
              id: "5",
              type: "sangaku",
              attributes: {
                title: "reorder_with_dummy_title",
                description: "reorder_with_dummy_description",
                difficulty: "normal",
                inputs: [],
                author_name: "another_user",
                kind: "reorder",
                code_blocks: [
                  { id: 1, content: "block1" },
                  { id: 2, content: "block2" },
                  { id: 3, content: "dummy_block" },
                ],
              },
              relationships: {
                user: { data: { id: "2", type: "user" } },
                shrine: { data: { id: "1", type: "shrine" } },
              },
            },
          },
          { status: 200 },
        );
      }),
      http.post(`${apiUrl}/api/v1/user/saved_sangakus/5/answer`, () => {
        return HttpResponse.json(
          {
            data: {
              id: "5",
              type: "answer",
              attributes: {
                source: null,
                status: "correct",
                kind: "reorder",
              },
              relationships: {
                user_sangaku_save: { data: { id: "5", type: "user_sangaku_save" } },
                answer_results: { data: [] },
              },
            },
          },
          { status: 200 },
        );
      }),
      http.get(`${apiUrl}/api/v1/user/saved_sangakus/5/answer`, () => {
        return HttpResponse.json(
          {
            data: {
              id: "5",
              type: "answer",
              attributes: {
                source: null,
                status: "correct",
                kind: "reorder",
              },
              relationships: {
                user_sangaku_save: { data: { id: "5", type: "user_sangaku_save" } },
                answer_results: { data: [] },
              },
            },
          },
          { status: 200 },
        );
      }),
      http.get(`${apiUrl}/api/v1/user/answers/5`, () => {
        return HttpResponse.json(
          {
            data: {
              id: "5",
              type: "answer",
              attributes: {
                source: null,
                status: "correct",
                kind: "reorder",
              },
              relationships: {
                user_sangaku_save: { data: { id: "5", type: "user_sangaku_save" } },
                answer_results: { data: [] },
              },
            },
          },
          { status: 200 },
        );
      }),
    );
    await setSession(page);

    // Act: 保存済みreorder算額（ダミーブロック入り）の解答画面へアクセスする
    await page.goto("/saved_sangakus/5/answer/create");
    const title = page.getByRole("heading", {
      name: "reorder_with_dummy_title",
    });
    await expect(title).toBeVisible();
    const unusedBlocksArea = page.getByTestId("unused-blocks-area");
    await expect(unusedBlocksArea).toBeVisible();

    // Act: ダミーブロックを除いた正解ブロックのみを正しい順序で解答エリアへ移動する
    await unusedBlocksArea
      .getByText("block1")
      .getByRole("button", { name: "解答エリアへ移動" })
      .click();
    await unusedBlocksArea
      .getByText("block2")
      .getByRole("button", { name: "解答エリアへ移動" })
      .click();

    // Assert: ダミーブロックは利用しないエリアに残ったまま解答エリアには含まれない
    await expect(unusedBlocksArea.getByText("dummy_block")).toBeVisible();
    const answerBlocksArea = page.getByTestId("answer-blocks-area");
    await expect(answerBlocksArea.getByTestId("drag-handle")).toHaveCount(2);

    // Act: 解答を終了する
    const submitButton = page.getByRole("button", { name: "解答を終了する" });
    page.once("dialog", async (dialog) => {
      await dialog.accept();
    });
    await submitButton.click();

    // Assert: 結果ページへリダイレクトされ、正解（明察）が表示される
    await expect(page).toHaveURL("/saved_sangakus/5/answer");
    const resultHeading = page.getByRole("heading", {
      name: "reorder_with_dummy_titleの結果",
    });
    await expect(resultHeading).toBeVisible();
    await expect(page.getByText("明察")).toBeVisible();
  });

  test("should allow me to see the incorrect result when answering a saved reorder sangaku in the wrong order", async ({
    page,
    msw,
  }) => {
    // Arrange
    msw.use(
      http.get(`${apiUrl}/api/v1/user/saved_sangakus/4`, () => {
        return HttpResponse.json(
          {
            data: {
              id: "4",
              type: "sangaku",
              attributes: {
                title: "reorder_incorrect_title",
                description: "reorder_incorrect_description",
                difficulty: "normal",
                inputs: [],
                author_name: "another_user",
                kind: "reorder",
                code_blocks: [
                  { id: 1, content: "block1" },
                  { id: 2, content: "block2" },
                  { id: 3, content: "block3" },
                ],
              },
              relationships: {
                user: { data: { id: "2", type: "user" } },
                shrine: { data: { id: "1", type: "shrine" } },
              },
            },
          },
          { status: 200 },
        );
      }),
      http.post(`${apiUrl}/api/v1/user/saved_sangakus/4/answer`, () => {
        return HttpResponse.json(
          {
            data: {
              id: "4",
              type: "answer",
              attributes: {
                source: null,
                status: "incorrect",
                kind: "reorder",
              },
              relationships: {
                user_sangaku_save: { data: { id: "4", type: "user_sangaku_save" } },
                answer_results: { data: [] },
              },
            },
          },
          { status: 200 },
        );
      }),
      http.get(`${apiUrl}/api/v1/user/saved_sangakus/4/answer`, () => {
        return HttpResponse.json(
          {
            data: {
              id: "4",
              type: "answer",
              attributes: {
                source: null,
                status: "incorrect",
                kind: "reorder",
              },
              relationships: {
                user_sangaku_save: { data: { id: "4", type: "user_sangaku_save" } },
                answer_results: { data: [] },
              },
            },
          },
          { status: 200 },
        );
      }),
      http.get(`${apiUrl}/api/v1/user/answers/4`, () => {
        return HttpResponse.json(
          {
            data: {
              id: "4",
              type: "answer",
              attributes: {
                source: null,
                status: "incorrect",
                kind: "reorder",
              },
              relationships: {
                user_sangaku_save: { data: { id: "4", type: "user_sangaku_save" } },
                answer_results: { data: [] },
              },
            },
          },
          { status: 200 },
        );
      }),
    );
    await setSession(page);

    // Act: 保存済みreorder算額の解答画面へアクセスする
    await page.goto("/saved_sangakus/4/answer/create");
    const title = page.getByRole("heading", { name: "reorder_incorrect_title" });
    await expect(title).toBeVisible();
    const unusedBlocksArea = page.getByTestId("unused-blocks-area");
    await expect(unusedBlocksArea).toBeVisible();

    // Act: 全ブロックを誤った順序で解答エリアへ移動する
    // バックエンド（モック）が不正解を返すため、移動順序自体は本テストの本質ではない
    const moveToAnswerButton = page.getByRole("button", {
      name: "解答エリアへ移動",
    });
    await moveToAnswerButton.first().click();
    await moveToAnswerButton.first().click();
    await moveToAnswerButton.first().click();
    await expect(page.getByTestId("unused-blocks-area").getByTestId("drag-handle")).toHaveCount(0);
    const answerBlocksArea = page.getByTestId("answer-blocks-area");
    await expect(answerBlocksArea.getByTestId("drag-handle")).toHaveCount(3);

    // Act: 解答を終了する
    const submitButton = page.getByRole("button", { name: "解答を終了する" });
    page.once("dialog", async (dialog) => {
      await dialog.accept();
    });
    await submitButton.click();

    // Assert: 結果ページへリダイレクトされ、不正解（誤謬）が表示される
    await expect(page).toHaveURL("/saved_sangakus/4/answer");
    const resultHeading = page.getByRole("heading", {
      name: "reorder_incorrect_titleの結果",
    });
    await expect(resultHeading).toBeVisible();
    await expect(page.getByText("誤謬")).toBeVisible();
  });
});
