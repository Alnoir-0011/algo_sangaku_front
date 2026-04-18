import { setSession } from "../../../__helpers__/signin";
import { waitForInteractive } from "../../../__helpers__/hydration";

import {
  test,
  expect,
  http,
  HttpResponse,
  passthrough,
} from "next/experimental/testmode/playwright/msw";

const apiUrl = process.env.API_URL;

test.describe("/sangakus/create", () => {
  test.describe("before signin", () => {
    test("redirect to signin page", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState();
      await page.goto("/sangakus/create");
      await expect(page).toHaveURL("/signin");
      const flash = page.locator('[role="alert"]:not([aria-live]):not([aria-atomic])');
      await expect(flash).toBeVisible({ timeout: 10_000 });
      await expect(flash).toContainText("サインインしてください");
      const mainNode = page.locator("main");
      const heading = mainNode.getByRole("heading", { name: "サインイン" });
      await expect(heading).toBeVisible();
      await page.reload();
      const drawer = page.locator("nav");
      const link = drawer.getByRole("button", { name: "サインイン" });
      await expect(link).toBeVisible();
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
          http.get(`${apiUrl}/api/v1/user/sangakus/generate_source_usage`, () => {
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

    test("can create sangaku", async ({ page, msw }) => {
      // NOTE:モックの定義
      const backendResponse = {
        data: {
          id: "70",
          type: "sangaku",
          attributes: {
            title: "test_title",
            description: "test_description",
            source: 'input = gets.chomp\nputs "test #{input}',
            difficulty: "normal",
            inputs: [
              {
                id: 15,
                content: "example",
              },
            ],
          },
          relationships: {
            user: {
              data: {
                id: "70",
                type: "user",
              },
            },
          },
        },
      };

      msw.use(
        http.post(`${apiUrl}/api/v1/user/sangakus`, () => {
          return HttpResponse.json(backendResponse, { status: 200 });
        }),
      );

      // NOTE:Test start
      await setSession(page);
      await page.goto("/sangakus/create");
      await page.waitForLoadState();
      await page.getByLabel("タイトル").fill("test_title");
      await page.getByLabel("問題文").fill("test_description");
      await page.getByRole("textbox", { name: "fixedInput-1" }).fill("example");
      const monacoEditor = page.locator(".monaco-editor").nth(0);
      await monacoEditor.click();
      await page.keyboard.press("ControlOrMeta+a");
      await page.keyboard.press("Backspace");
      await page.keyboard.type("input = gets.chomp");
      await page.keyboard.press("Enter");
      await page.keyboard.type('puts "test #{input}"');
      await page.getByRole("button", { name: "確認画面へ" }).click();
      await page.waitForLoadState();
      const readOnlyEditor = page
        .locator(".MuiModal-root")
        .locator(".monaco-editor");
      await expect(readOnlyEditor).toBeVisible();
      const resultText = page.getByLabel("result-1");
      await expect(resultText).toBeVisible();
      await page.getByRole("button", { name: "保存する" }).click();
      await expect(page).toHaveURL("/");
      const flash = page.locator('[role="alert"]:not([aria-live]):not([aria-atomic])');
      await expect(flash).toBeVisible({ timeout: 10_000 });
      await expect(flash).toContainText("算額を作成しました");
    });

    test("generate button is disabled when description is empty", async ({
      page,
    }) => {
      await setSession(page);
      await page.goto("/sangakus/create");
      await page.waitForLoadState();
      await waitForInteractive(page.getByLabel("問題文"));

      const generateButton = page.getByRole("button", {
        name: "問題文からコードを生成",
      });
      await expect(generateButton).toBeDisabled();

      await page
        .getByLabel("問題文")
        .fill("1からnまでの合計を出力してください");
      await expect(generateButton).toBeEnabled({ timeout: 10_000 });

      await page.getByLabel("問題文").fill("");
      await expect(generateButton).toBeDisabled();
    });

    test("can generate source code from description", async ({ page, msw }) => {
      const generatedSource =
        "# 対応言語: Ruby\nn = gets.chomp.to_i\nputs (1..n).sum";
      const backendResponse = {
        data: {
          id: "70",
          type: "sangaku",
          attributes: {
            title: "test_title",
            description: "test_description",
            source: generatedSource,
            difficulty: "normal",
            inputs: [{ id: 15, content: "5" }],
          },
          relationships: {
            user: { data: { id: "70", type: "user" } },
          },
        },
      };

      msw.use(
        http.post(`${apiUrl}/api/v1/user/sangakus/generate_source`, () => {
          return HttpResponse.json(
            {
              source: generatedSource,
              usage: { used: 1, limit: 5, remaining: 4, reset_at: "2026-04-12T18:00:00Z" },
            },
            { status: 200 },
          );
        }),
        http.post(`${apiUrl}/api/v1/user/sangakus`, () => {
          return HttpResponse.json(backendResponse, { status: 200 });
        }),
      );

      await setSession(page);
      await page.goto("/sangakus/create");
      await page.waitForLoadState();
      await waitForInteractive(page.getByLabel("問題文"));

      await page.getByLabel("タイトル").fill("test_title");
      await page
        .getByLabel("問題文")
        .fill("1からnまでの合計を出力してください");
      await page.getByRole("textbox", { name: "fixedInput-1" }).fill("5");

      const generateButton = page.getByRole("button", {
        name: "問題文からコードを生成",
      });
      await generateButton.click();

      // ローディング完了後にボタンが再び有効になる
      await expect(generateButton).toBeEnabled({ timeout: 10000 });

      // 生成されたコードがMonaco Editorに反映されているか確認
      const editorContent = await page.evaluate(() => {
        const models =
          (
            window as unknown as {
              monaco?: {
                editor?: { getModels?: () => { getValue?: () => string }[] };
              };
            }
          ).monaco?.editor?.getModels?.() || [];
        return models[0]?.getValue?.() || "";
      });
      expect(editorContent).not.toBe("");
      expect(editorContent).toContain("対応言語: Ruby");

      // 確認画面を通じて保存できる
      await page.getByRole("button", { name: "確認画面へ" }).click();
      await page.waitForLoadState();
      const readOnlyEditor = page
        .locator(".MuiModal-root")
        .locator(".monaco-editor");
      await expect(readOnlyEditor).toBeVisible();
      await page.getByRole("button", { name: "保存する" }).click();
      await expect(page).toHaveURL("/");
      const flash = page.locator('[role="alert"]:not([aria-live]):not([aria-atomic])');
      await expect(flash).toBeVisible({ timeout: 10_000 });
      await expect(flash).toContainText("算額を作成しました");
    });

    test("error message visible", async ({ page, msw }) => {
      // NOTE:モックの定義
      const backendResponse = {
        message: "Bad Request",
        errors: [
          ["title", ["を入力してください"]],
          ["description", ["を入力してください"]],
          ["source", ["を入力してください"]],
          ["fixed_inputs", ["固定入力が重複しています"]],
        ],
      };

      msw.use(
        http.post(`${apiUrl}/api/v1/user/sangakus`, () => {
          return HttpResponse.json(backendResponse, { status: 400 });
        }),
      );

      // NOTE: Test start
      await setSession(page);
      await page.goto("/sangakus/create");
      await page.waitForLoadState();
      // NOTE: フォーム操作
      await page.getByLabel("タイトル").fill("");
      await page.getByLabel("問題文").fill("");
      await page.getByRole("button", { name: "addButton" }).click();
      await page.getByRole("textbox", { name: "fixedInput-1" }).fill("example");
      await page.getByRole("textbox", { name: "fixedInput-2" }).fill("example");
      // NOTE: monaco-editorの操作
      const monacoEditor = page.locator(".monaco-editor").nth(0);
      await monacoEditor.click();
      await page.keyboard.press("ControlOrMeta+a");
      await page.keyboard.press("Backspace");
      await page.getByRole("button", { name: "確認画面へ" }).click();
      await page.waitForLoadState();
      const readOnlyEditor = page
        .locator(".MuiModal-root")
        .locator(".monaco-editor");
      await expect(readOnlyEditor).toBeVisible();
      await page.getByRole("button", { name: "保存する" }).click();
      await expect(page).toHaveURL("/sangakus/create");
      const titleErrorMessage = page.getByLabel("titleError");
      await expect(titleErrorMessage).toBeVisible();
      await expect(titleErrorMessage).toHaveText("を入力してください");
      const descriptionErrorMessage = page.getByLabel("descriptionError");
      await expect(descriptionErrorMessage).toBeVisible();
      await expect(descriptionErrorMessage).toHaveText("を入力してください");
      const fixxedInputsErrorMessage = page.getByLabel("fixedInputsError");
      await expect(fixxedInputsErrorMessage).toBeVisible();
      await expect(fixxedInputsErrorMessage).toHaveText(
        "固定入力が重複しています",
      );
      const sourceErrorMessage = page.getByLabel("sourceError");
      await expect(sourceErrorMessage).toBeVisible();
      await expect(sourceErrorMessage).toHaveText("を入力してください");
    });

    test("shows usage indicator with remaining count", async ({ page }) => {
      await setSession(page);
      await page.goto("/sangakus/create");
      await page.waitForLoadState();

      const usageIndicator = page.getByText(/本日の残り生成回数: 5 \/ 5/);
      await expect(usageIndicator).toBeVisible();
    });

    test("updates usage count after successful generation", async ({ page, msw }) => {
      const generatedSource = "# 対応言語: Ruby\nn = gets.chomp.to_i\nputs n";

      msw.use(
        http.post(`${apiUrl}/api/v1/user/sangakus/generate_source`, () => {
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
      await page.goto("/sangakus/create");
      await page.waitForLoadState();
      await waitForInteractive(page.getByLabel("問題文"));

      await page.getByLabel("問題文").fill("nを出力してください");
      await page.getByRole("button", { name: "問題文からコードを生成" }).click();
      await expect(page.getByRole("button", { name: "問題文からコードを生成" })).toBeEnabled({ timeout: 10000 });

      const usageIndicator = page.getByText(/本日の残り生成回数: 4 \/ 5/);
      await expect(usageIndicator).toBeVisible();
    });

    test("shows error message on 429 response", async ({ page, msw }) => {
      msw.use(
        http.post(`${apiUrl}/api/v1/user/sangakus/generate_source`, () => {
          return HttpResponse.json({}, { status: 429 });
        }),
      );

      await setSession(page);
      await page.goto("/sangakus/create");
      await page.waitForLoadState();
      await waitForInteractive(page.getByLabel("問題文"));

      await page.getByLabel("問題文").fill("問題文を入力");
      await page.getByRole("button", { name: "問題文からコードを生成" }).click();

      const errorMessage = page.getByLabel("generateErrorMessage");
      await expect(errorMessage).toBeVisible({ timeout: 10000 });
      await expect(errorMessage).toHaveText(
        "本日の利用上限に達しました。明日 3 時以降に再度お試しください。",
      );
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
          http.get(`${apiUrl}/api/v1/user/sangakus/generate_source_usage`, () => {
            return HttpResponse.json(
              { used: 5, limit: 5, remaining: 0, reset_at: "2026-04-12T18:00:00Z" },
              { status: 200 },
            );
          }),
          http.all("*", () => passthrough()),
        ],
        { scope: "test" },
      ],
    });

    test("generate button is disabled when remaining is 0", async ({ page }) => {
      await setSession(page);
      await page.goto("/sangakus/create");
      await page.waitForLoadState();

      await page.getByLabel("問題文").fill("問題文を入力");
      const generateButton = page.getByRole("button", { name: "問題文からコードを生成" });
      await expect(generateButton).toBeDisabled();

      const usageIndicator = page.getByText(/本日の残り生成回数: 0 \/ 5/);
      await expect(usageIndicator).toBeVisible();
    });
  });
});
