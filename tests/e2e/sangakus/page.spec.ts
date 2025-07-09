import { setSession } from "../../__helpers__/signin";

import {
  test,
  expect,
  http,
  HttpResponse,
  passthrough,
} from "next/experimental/testmode/playwright/msw";

test.describe("/sangakus/create", () => {
  test.describe("before signin", () => {
    test("redirect to root", async ({ page }) => {
      await page.goto("/sangakus/create");
      await expect(page).toHaveURL("/signin");
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
          http.get("http://localhost:3000/up", () => {
            return HttpResponse.json({
              message: "success",
            });
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
            difficulty: "nomal",
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
        http.post("http://localhost:3000/api/v1/sangakus", () => {
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
      await page.keyboard.press("Meta+KeyA");
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
        http.post("http://localhost:3000/api/v1/sangakus", () => {
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
      await page.keyboard.press("Meta+KeyA");
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
  });
});
