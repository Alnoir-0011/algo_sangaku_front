import { setSession } from "@/tests/__helpers__/signin";
import { waitForInteractive, waitForMonacoEditor } from "@/tests/__helpers__/hydration";
import {
  test,
  expect,
  http,
  HttpResponse,
  passthrough,
} from "@/tests/e2e/fixtures.msw";

const apiUrl = process.env.API_URL;

test.describe("/user/sangakus/[id]/edit", () => {
  test.describe("before signin", () => {
    test("should not allow me to visit sangaku edit page without signing in and redirect to signin", async ({ page }) => {
      await page.goto("/user/sangakus/1/edit");
      await expect(page).toHaveURL("/signin");
      const flash = page.getByTestId('flash-message');
      await expect(flash).toBeVisible({ timeout: 10_000 });
      await expect(flash).toContainText("サインインしてください");
    });
  });

  test.describe("after signin", () => {
    test.use({
      mswHandlers: [
        [
          http.get(`${apiUrl}/up`, () => {
            return HttpResponse.json({
              message: "success",
            });
          }),
          http.get(`${apiUrl}/api/v1/user/sangakus/1`, () => {
            return HttpResponse.json(
              {
                data: {
                  id: "1",
                  type: "sangaku",
                  attributes: {
                    title: "before_edit",
                    description: "test_description",
                    source: 'input = gets.chomp\nputs "test #{input}',
                    difficulty: "normal",
                    inputs: [
                      {
                        id: 1,
                        content: "example",
                      },
                    ],
                  },
                  relationships: {
                    user: {
                      data: {
                        id: "1",
                        type: "user",
                      },
                    },
                  },
                },
              },
              { status: 200 },
            );
          }),
          http.get(`${apiUrl}/api/v1/user/sangakus/999`, () => {
            return HttpResponse.json({}, { status: 404 });
          }),
          http.get(`${apiUrl}/api/v1/user/code_sangakus/generate_source_usage`, () => {
            return HttpResponse.json(
              { used: 0, limit: 5, remaining: 5, reset_at: "2026-04-12T18:00:00Z" },
              { status: 200 },
            );
          }),
          http.get(`${apiUrl}/api/v1/user/sangakus`, () => {
            return HttpResponse.json(
              { data: [] },
              { status: 200, headers: { "total-pages": "0", "current-page": "1", "total-count": "0" } },
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

    test("should allow me to see edited content reflected in the confirmation modal", async ({ page }) => {
      await setSession(page);

      await page.goto("/user/sangakus/1/edit");
      await page.getByLabel("タイトル").fill("test_changed");
      await page.getByLabel("問題文").fill("changed_description");
      const monacoEditor = page.getByTestId("monaco-editor-source");
      await waitForMonacoEditor(page);
      await monacoEditor.click();
      await page.keyboard.press("ControlOrMeta+a");
      await page.keyboard.press("Backspace");
      await page.keyboard.type("input = gets.chomp");
      await page.keyboard.press("Enter");
      await page.keyboard.type('puts "test changed #{input}"');
      await page.getByRole("button", { name: "確認画面へ" }).click();
      const checkModal = page.getByTestId("check-page-modal");
      await expect(checkModal).toBeVisible();
      await expect(page.getByTestId("check-page-editor")).toContainText("test changed");
      const resultText = page.getByLabel("result-1");
      await expect(resultText).toBeVisible();
    });

    test("should allow me to save edited sangaku and be redirected with flash message", async ({ page, msw }) => {
      msw.use(
        http.patch(`${apiUrl}/api/v1/user/code_sangakus/1`, () => {
          return HttpResponse.json(
            {
              data: {
                id: "1",
                type: "sangaku",
                attributes: {
                  title: "changed_title",
                  description: "test_description",
                  source: 'input = gets.chomp\nputs "test #{input}',
                  difficulty: "difficult",
                  inputs: [{ id: 1, content: "example" }],
                },
                relationships: { user: { data: { id: "70", type: "user" } } },
              },
            },
            { status: 200 },
          );
        }),
      );

      await setSession(page);
      await page.goto("/user/sangakus/1/edit");
      await waitForMonacoEditor(page);
      await page.getByRole("button", { name: "確認画面へ" }).click();
      await expect(page.getByTestId("check-page-modal")).toBeVisible();
      await page.getByRole("button", { name: "保存する" }).click();
      await expect(page).toHaveURL("/user/sangakus");
      const flash = page.getByTestId('flash-message');
      await expect(flash).toBeVisible({ timeout: 10_000 });
      await expect(flash).toContainText("算額を更新しました");
    });

    test("should not allow me to click the generate button when description is empty", async ({
      page,
      msw,
    }) => {
      msw.use(
        http.patch(`${apiUrl}/api/v1/user/code_sangakus/1`, () => {
          return HttpResponse.json({}, { status: 200 });
        }),
      );

      await setSession(page);
      await page.goto("/user/sangakus/1/edit");
      await waitForMonacoEditor(page);
      await waitForInteractive(page.getByLabel("問題文"));

      // 初期値（"test_description"）が入っているのでボタンは有効
      const generateButton = page.getByRole("button", {
        name: "問題文からコードを生成",
      });
      await expect(generateButton).toBeEnabled({ timeout: 10_000 });

      // 問題文を空にするとボタンが無効になる
      await page.getByLabel("問題文").fill("");
      await expect(generateButton).toBeDisabled();
    });

    test("should allow me to click the generate button again after refilling description", async ({
      page,
      msw,
    }) => {
      msw.use(
        http.patch(`${apiUrl}/api/v1/user/code_sangakus/1`, () => {
          return HttpResponse.json({}, { status: 200 });
        }),
      );

      await setSession(page);
      await page.goto("/user/sangakus/1/edit");
      await waitForMonacoEditor(page);
      await waitForInteractive(page.getByLabel("問題文"));

      const generateButton = page.getByRole("button", {
        name: "問題文からコードを生成",
      });

      // 問題文を空にするとボタンが無効になる
      await page.getByLabel("問題文").fill("");
      await expect(generateButton).toBeDisabled();

      // 再度入力するとボタンが有効になる
      await page.getByLabel("問題文").fill("問題文を入力");
      await expect(generateButton).toBeEnabled({ timeout: 10_000 });
    });

    test("should allow me to see generated code reflected in Monaco Editor", async ({ page, msw }) => {
      const generatedSource =
        "# 対応言語: Ruby\nn = gets.chomp.to_i\nputs (1..n).sum";

      msw.use(
        http.post(`${apiUrl}/api/v1/user/code_sangakus/generate_source`, () => {
          return HttpResponse.json(
            {
              source: generatedSource,
              usage: { used: 1, limit: 5, remaining: 4, reset_at: "2026-04-12T18:00:00Z" },
            },
            { status: 200 },
          );
        }),
      );

      await setSession(page);
      await page.goto("/user/sangakus/1/edit");
      await waitForMonacoEditor(page);
      await waitForInteractive(page.getByLabel("問題文"));

      const generateButton = page.getByRole("button", { name: "問題文からコードを生成" });
      await expect(generateButton).toBeEnabled({ timeout: 10_000 });
      await generateButton.click();

      // ローディング完了後にボタンが再び有効になる
      await expect(generateButton).toBeEnabled({ timeout: 10_000 });

      // 生成されたコードがMonaco Editorに反映されているか確認
      await expect(page.getByTestId("monaco-editor-source")).toContainText("対応言語: Ruby", { timeout: 10_000 });
    });

    test("should allow me to save sangaku with generated source code", async ({ page, msw }) => {
      const generatedSource =
        "# 対応言語: Ruby\nn = gets.chomp.to_i\nputs (1..n).sum";

      msw.use(
        http.post(`${apiUrl}/api/v1/user/code_sangakus/generate_source`, () => {
          return HttpResponse.json(
            {
              source: generatedSource,
              usage: { used: 1, limit: 5, remaining: 4, reset_at: "2026-04-12T18:00:00Z" },
            },
            { status: 200 },
          );
        }),
        http.patch(`${apiUrl}/api/v1/user/code_sangakus/1`, () => {
          return HttpResponse.json(
            {
              data: {
                id: "1",
                type: "sangaku",
                attributes: {
                  title: "before_edit",
                  description: "test_description",
                  source: generatedSource,
                  difficulty: "normal",
                  inputs: [{ id: 1, content: "example" }],
                },
                relationships: { user: { data: { id: "1", type: "user" } } },
              },
            },
            { status: 200 },
          );
        }),
      );

      await setSession(page);
      await page.goto("/user/sangakus/1/edit");
      await waitForMonacoEditor(page);
      await waitForInteractive(page.getByLabel("問題文"));

      await page.getByRole("button", { name: "問題文からコードを生成" }).click();
      await expect(page.getByRole("button", { name: "問題文からコードを生成" })).toBeEnabled({ timeout: 10_000 });

      await page.getByRole("button", { name: "確認画面へ" }).click();
      await expect(page.getByTestId("check-page-editor")).toBeVisible();
      await page.getByRole("button", { name: "保存する" }).click();
      await expect(page).toHaveURL("/user/sangakus");
      const flash = page.getByTestId('flash-message');
      await expect(flash).toBeVisible({ timeout: 10_000 });
      await expect(flash).toContainText("算額を更新しました");
    });

    test("should allow me to visit non-existent sangaku edit page and see not found message", async ({ page }) => {
      await setSession(page);

      await page.goto("/user/sangakus/999/edit");
      const message = page.getByRole("heading", {
        name: "This page could not be found.",
      });
      await expect(message).toBeVisible();
    });

    test("should allow me to see usage indicator with remaining count", async ({ page }) => {
      await setSession(page);
      await page.goto("/user/sangakus/1/edit");

      const usageIndicator = page.getByText(/本日の残り生成回数: 5 \/ 5/);
      await expect(usageIndicator).toBeVisible();
    });

    test("should allow me to see updated usage count after successful generation", async ({ page, msw }) => {
      const generatedSource = "# 対応言語: Ruby\nn = gets.chomp.to_i\nputs n";

      msw.use(
        http.post(`${apiUrl}/api/v1/user/code_sangakus/generate_source`, () => {
          return HttpResponse.json(
            {
              source: generatedSource,
              usage: { used: 1, limit: 5, remaining: 4, reset_at: "2026-04-12T18:00:00Z" },
            },
            { status: 200 },
          );
        }),
      );

      await setSession(page);
      await page.goto("/user/sangakus/1/edit");
      await waitForMonacoEditor(page);
      await waitForInteractive(page.getByLabel("問題文"));

      await expect(page.getByLabel("問題文")).toHaveValue("test_description");
      await page.getByRole("button", { name: "問題文からコードを生成" }).click();
      await expect(page.getByRole("button", { name: "問題文からコードを生成" })).toBeEnabled({ timeout: 10_000 });

      const usageIndicator = page.getByText(/本日の残り生成回数: 4 \/ 5/);
      await expect(usageIndicator).toBeVisible();
    });

    test("should allow me to see an error message on 429 response", async ({ page, msw }) => {
      msw.use(
        http.post(`${apiUrl}/api/v1/user/code_sangakus/generate_source`, () => {
          return HttpResponse.json({}, { status: 429 });
        }),
      );

      await setSession(page);
      await page.goto("/user/sangakus/1/edit");
      await waitForMonacoEditor(page);
      await waitForInteractive(page.getByLabel("問題文"));

      await page.getByRole("button", { name: "問題文からコードを生成" }).click();

      const errorMessage = page.getByTestId("generate-error-message");
      await expect(errorMessage).toBeVisible({ timeout: 10_000 });
      await expect(errorMessage).toHaveText(
        "本日の利用上限に達しました。明日 3 時以降に再度お試しください。",
      );
      await expect(
        page.getByRole("button", { name: "問題文からコードを生成" }),
      ).toBeDisabled();
    });

    test("should allow me to change difficulty before saving", async ({ page, msw }) => {
      msw.use(
        http.patch(`${apiUrl}/api/v1/user/code_sangakus/1`, () => {
          return HttpResponse.json({
            data: {
              id: "1",
              type: "sangaku",
              attributes: {
                title: "before_edit",
                description: "test_description",
                source: 'input = gets.chomp\nputs "test #{input}',
                difficulty: "easy",
                inputs: [{ id: 1, content: "example" }],
              },
              relationships: { user: { data: { id: "1", type: "user" } } },
            },
          }, { status: 200 });
        }),
      );

      await setSession(page);
      await page.goto("/user/sangakus/1/edit");
      await expect(page.getByRole("combobox", { name: "難易度" })).toBeEnabled({ timeout: 10_000 });

      await page.getByRole("combobox", { name: "難易度" }).click();
      await page.getByRole("option", { name: "簡単" }).click();

      await page.getByRole("button", { name: "確認画面へ" }).click();
      await expect(page.getByTestId("check-page-modal")).toBeVisible();
      await page.getByRole("button", { name: "保存する" }).click();
      await expect(page).toHaveURL("/user/sangakus");
      const flash = page.getByTestId('flash-message');
      await expect(flash).toBeVisible({ timeout: 10_000 });
      await expect(flash).toContainText("算額を更新しました");
    });

    test("should allow me to see validation errors on failed update", async ({ page, msw }) => {
      msw.use(
        http.patch(`${apiUrl}/api/v1/user/code_sangakus/1`, () => {
          return HttpResponse.json({
            message: "Bad Request",
            errors: [
              ["title", ["を入力してください"]],
              ["description", ["を入力してください"]],
              ["source", ["を入力してください"]],
              ["fixed_inputs", ["固定入力が重複しています"]],
            ],
          }, { status: 400 });
        }),
      );

      await setSession(page);
      await page.goto("/user/sangakus/1/edit");
      await waitForMonacoEditor(page);

      await page.getByRole("button", { name: "確認画面へ" }).click();
      await page.getByRole("button", { name: "保存する" }).click();
      await expect(page).toHaveURL("/user/sangakus/1/edit");

      await expect(page.getByLabel("titleError")).toHaveText("を入力してください");
      await expect(page.getByLabel("descriptionError")).toHaveText("を入力してください");
      await expect(page.getByLabel("fixedInputsError")).toHaveText("固定入力が重複しています");
      await expect(page.getByLabel("sourceError")).toHaveText("を入力してください");
    });

    test("should allow me to go back from the confirmation modal to the edit screen", async ({ page }) => {
      await setSession(page);
      await page.goto("/user/sangakus/1/edit");
      await waitForMonacoEditor(page);

      await page.getByRole("button", { name: "確認画面へ" }).click();
      await expect(page.getByTestId("check-page-modal")).toBeVisible();
      await page.getByRole("button", { name: "作成画面に戻る" }).click();
      await expect(page.getByTestId("check-page-modal")).not.toBeVisible({ timeout: 3_000 });
      await expect(page.getByLabel("タイトル")).toHaveValue("before_edit");
    });

    test("should allow me to see a warning message when description exceeds 2000 characters", async ({ page }) => {
      await setSession(page);
      await page.goto("/user/sangakus/1/edit");
      await waitForInteractive(page.getByLabel("問題文"));

      const longDescription = "あ".repeat(2001);
      await page.getByLabel("問題文").fill(longDescription);
      await expect(
        page.getByText("問題文は2000文字以内で入力してください"),
      ).toBeVisible({ timeout: 5_000 });
      // 文字数超過中は生成ボタンも無効
      await expect(
        page.getByRole("button", { name: "問題文からコードを生成" }),
      ).toBeDisabled();
    });
  });

  test.describe("when daily limit is reached", () => {
    test.use({
      mswHandlers: [
        [
          http.get(`${apiUrl}/up`, () => {
            return HttpResponse.json({ message: "success" });
          }),
          http.get(`${apiUrl}/api/v1/user/sangakus/1`, () => {
            return HttpResponse.json(
              {
                data: {
                  id: "1",
                  type: "sangaku",
                  attributes: {
                    title: "before_edit",
                    description: "test_description",
                    source: 'input = gets.chomp\nputs "test #{input}',
                    difficulty: "normal",
                    inputs: [{ id: 1, content: "example" }],
                  },
                  relationships: { user: { data: { id: "1", type: "user" } } },
                },
              },
              { status: 200 },
            );
          }),
          http.get(`${apiUrl}/api/v1/user/code_sangakus/generate_source_usage`, () => {
            return HttpResponse.json(
              { used: 5, limit: 5, remaining: 0, reset_at: "2026-04-12T18:00:00Z" },
              { status: 200 },
            );
          }),
          http.get(`${apiUrl}/api/v1/user/sangakus`, () => {
            return HttpResponse.json(
              { data: [] },
              { status: 200, headers: { "total-pages": "0", "current-page": "1", "total-count": "0" } },
            );
          }),
          http.all("*", () => passthrough()),
        ],
        { scope: "test" },
      ],
    });

    test("should not allow me to click the generate button when remaining is 0", async ({ page }) => {
      await setSession(page);
      await page.goto("/user/sangakus/1/edit");

      // 初期値（"test_description"）が入っていてもボタンはdisabledのまま
      const generateButton = page.getByRole("button", { name: "問題文からコードを生成" });
      await expect(generateButton).toBeDisabled();
    });

    test("should allow me to see usage indicator showing 0 remaining", async ({ page }) => {
      await setSession(page);
      await page.goto("/user/sangakus/1/edit");

      const usageIndicator = page.getByText(/本日の残り生成回数: 0 \/ 5/);
      await expect(usageIndicator).toBeVisible();
    });
  });

  test.describe("kind branching", () => {
    test.use({
      mswHandlers: [
        [
          http.get(`${apiUrl}/up`, () => {
            return HttpResponse.json({ message: "success" });
          }),
          http.get(`${apiUrl}/api/v1/user/sangakus/2`, () => {
            return HttpResponse.json(
              {
                data: {
                  id: "2",
                  type: "sangaku",
                  attributes: {
                    title: "reorder_title",
                    description: "reorder_description",
                    difficulty: "easy",
                    kind: "reorder",
                    source: null,
                    inputs: [],
                    author_name: "test",
                    shrine_name: null,
                    code_blocks: [
                      { id: 1, content: "puts 1", correct_position: 1 },
                      { id: 2, content: "puts 2", correct_position: 2 },
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
          http.get(`${apiUrl}/api/v1/user/code_sangakus/generate_source_usage`, () => {
            return HttpResponse.json(
              { used: 0, limit: 5, remaining: 5, reset_at: "2026-04-12T18:00:00Z" },
              { status: 200 },
            );
          }),
          http.get(`${apiUrl}/api/v1/user/sangakus`, () => {
            return HttpResponse.json(
              { data: [] },
              { status: 200, headers: { "total-pages": "0", "current-page": "1", "total-count": "0" } },
            );
          }),
          // allow all non-mocked routes to pass through
          http.all("*", () => {
            return passthrough();
          }),
        ],
        { scope: "test" },
      ],
    });

    test("should allow me to see reorder sangaku edit form when kind is reorder", async ({ page }) => {
      // Arrange: kind: "reorder" の算額データを返すサインイン済みユーザーとしてセッションを準備する
      await setSession(page);

      // Act: 並べ替え問題の編集ページへ遷移する
      await page.goto("/user/sangakus/2/edit");

      // Assert
      await expect(page.getByLabel("タイトル")).toHaveValue("reorder_title");
      await expect(page.getByLabel("block-content-0")).toHaveValue("puts 1");
    });

    test("should allow me to save reorder sangaku with correctly shaped payload when editing", async ({ page, msw }) => {
      // Arrange: GET/PATCH とも msw で扱う（page.route はサーバーコンポーネントの
      // fetch を捕捉できないため、Next.js testmode 経由の msw に統一する）
      let capturedBody: unknown;
      msw.use(
        http.get(`${apiUrl}/api/v1/user/sangakus/3`, () => {
          return HttpResponse.json({
            data: {
              id: "3",
              type: "sangaku",
              attributes: {
                title: "reorder_title",
                description: "reorder_description",
                difficulty: "easy",
                kind: "reorder",
                source: null,
                inputs: [],
                author_name: "test",
                shrine_name: null,
                code_blocks: [
                  { id: 1, content: "puts 1", correct_position: 1 },
                  { id: 2, content: "puts 2", correct_position: 2 },
                ],
              },
              relationships: { user: { data: { id: "1", type: "user" } }, shrine: { data: null } },
            },
          });
        }),
        http.patch(`${apiUrl}/api/v1/user/reorder_sangakus/3`, async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json(
            {
              data: {
                id: "3",
                type: "sangaku",
                attributes: {
                  title: "reorder_title",
                  description: "reorder_description",
                  difficulty: "easy",
                  kind: "reorder",
                  source: null,
                  inputs: [],
                  author_name: "test",
                  shrine_name: null,
                  code_blocks: [],
                },
                relationships: { user: { data: { id: "1", type: "user" } }, shrine: { data: null } },
              },
            },
            { status: 200 },
          );
        }),
      );

      // Act: サインイン済みユーザーとして編集ページへ遷移し、保存する
      await setSession(page);
      await page.goto("/user/sangakus/3/edit");
      await page.getByRole("button", { name: "確認画面へ" }).click();
      await expect(page.getByTestId("reorder-check-page-modal")).toBeVisible();
      await page.getByRole("button", { name: "保存する" }).click();

      // Assert
      // 非同期の PATCH リクエスト到達を待つためのポーリング。実際の内容検証は直後の toEqual で行う
      await expect.poll(() => capturedBody).not.toBeUndefined();
      expect(capturedBody).toEqual({
        sangaku: { title: "reorder_title", description: "reorder_description", difficulty: "easy" },
        code_blocks: [
          { content: "puts 1", correct_position: 1 },
          { content: "puts 2", correct_position: 2 },
        ],
      });
    });

    test("should allow me to preserve a dummy block as correct_position null when editing without changes", async ({
      page,
      msw,
    }) => {
      // Arrange: correct_position が null のダミーブロックを含む並べ替え算額を用意する。
      // EditReorderForm の code_blocks → CodeBlockDraft 変換（correct_position===null → isDummy:true）と、
      // ReorderSangakuForm 側の CodeBlockDraft → 送信ペイロード変換（isDummy:true → correct_position:null）が
      // 一往復して元の null を保っているかを検証する
      let capturedBody: unknown;
      msw.use(
        http.get(`${apiUrl}/api/v1/user/sangakus/5`, () => {
          return HttpResponse.json({
            data: {
              id: "5",
              type: "sangaku",
              attributes: {
                title: "reorder_title",
                description: "reorder_description",
                difficulty: "easy",
                kind: "reorder",
                source: null,
                inputs: [],
                author_name: "test",
                shrine_name: null,
                code_blocks: [
                  { id: 1, content: "puts 1", correct_position: 1 },
                  { id: 2, content: "puts 2", correct_position: 2 },
                  { id: 3, content: "dummy", correct_position: null },
                ],
              },
              relationships: { user: { data: { id: "1", type: "user" } }, shrine: { data: null } },
            },
          });
        }),
        http.patch(`${apiUrl}/api/v1/user/reorder_sangakus/5`, async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json(
            {
              data: {
                id: "5",
                type: "sangaku",
                attributes: {
                  title: "reorder_title",
                  description: "reorder_description",
                  difficulty: "easy",
                  kind: "reorder",
                  source: null,
                  inputs: [],
                  author_name: "test",
                  shrine_name: null,
                  code_blocks: [],
                },
                relationships: { user: { data: { id: "1", type: "user" } }, shrine: { data: null } },
              },
            },
            { status: 200 },
          );
        }),
      );

      // Act: 何も編集せずそのまま保存する
      await setSession(page);
      await page.goto("/user/sangakus/5/edit");
      await page.getByRole("button", { name: "確認画面へ" }).click();
      await expect(page.getByTestId("reorder-check-page-modal")).toBeVisible();
      await page.getByRole("button", { name: "保存する" }).click();

      // Assert
      // 非同期の PATCH リクエスト到達を待つためのポーリング。実際の内容検証は直後の toEqual で行う
      await expect.poll(() => capturedBody).not.toBeUndefined();
      expect(capturedBody).toEqual({
        sangaku: { title: "reorder_title", description: "reorder_description", difficulty: "easy" },
        code_blocks: [
          { content: "puts 1", correct_position: 1 },
          { content: "puts 2", correct_position: 2 },
          { content: "dummy", correct_position: null },
        ],
      });
    });

    test("should allow me to be redirected with a flash message when reorder sangaku is updated successfully", async ({ page, msw }) => {
      // Arrange: GET/PATCH とも msw で扱う（page.route はサーバーコンポーネントの
      // fetch を捕捉できないため、Next.js testmode 経由の msw に統一する）
      msw.use(
        http.get(`${apiUrl}/api/v1/user/sangakus/4`, () => {
          return HttpResponse.json({
            data: {
              id: "4",
              type: "sangaku",
              attributes: {
                title: "reorder_title",
                description: "reorder_description",
                difficulty: "easy",
                kind: "reorder",
                source: null,
                inputs: [],
                author_name: "test",
                shrine_name: null,
                code_blocks: [
                  { id: 1, content: "puts 1", correct_position: 1 },
                  { id: 2, content: "puts 2", correct_position: 2 },
                ],
              },
              relationships: { user: { data: { id: "1", type: "user" } }, shrine: { data: null } },
            },
          });
        }),
        http.patch(`${apiUrl}/api/v1/user/reorder_sangakus/4`, () => {
          return HttpResponse.json(
            {
              data: {
                id: "4",
                type: "sangaku",
                attributes: {
                  title: "reorder_title",
                  description: "reorder_description",
                  difficulty: "easy",
                  kind: "reorder",
                  source: null,
                  inputs: [],
                  author_name: "test",
                  shrine_name: null,
                  code_blocks: [],
                },
                relationships: { user: { data: { id: "1", type: "user" } }, shrine: { data: null } },
              },
            },
            { status: 200 },
          );
        }),
      );

      // Act: サインイン済みユーザーとして編集ページへ遷移し、保存する
      await setSession(page);
      await page.goto("/user/sangakus/4/edit");
      await page.getByRole("button", { name: "確認画面へ" }).click();
      await expect(page.getByTestId("reorder-check-page-modal")).toBeVisible();
      await page.getByRole("button", { name: "保存する" }).click();

      // Assert
      await expect(page).toHaveURL("/user/sangakus");
      const flash = page.getByTestId("flash-message");
      await expect(flash).toBeVisible({ timeout: 10_000 });
      await expect(flash).toContainText("算額を更新しました");
    });
  });
});
