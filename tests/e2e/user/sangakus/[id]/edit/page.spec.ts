import { setSession } from "@/tests/__helpers__/signin";
import {
  test,
  expect,
  http,
  HttpResponse,
  passthrough,
} from "next/experimental/testmode/playwright/msw";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

test.describe("/user/sangakus/[id]/edit", () => {
  test.describe("before signin", () => {
    test("redirect to signin page", async ({ page }) => {
      await page.goto("/user/sangakus/1/edit");

      await expect(page).toHaveURL("/signin");
      const flash = page.getByText("サインインしてください");
      await expect(flash).toBeVisible();
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
                    difficulty: "nomal",
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
          // allow all non-mocked routes to pass through
          http.all("*", () => {
            return passthrough();
          }),
        ],
        { scope: "test" }, // or 'worker'
      ],
    });

    test("should allow me to edit own sangaku", async ({ page, msw }) => {
      const backendResponse = {
        data: {
          id: "1",
          type: "sangaku",
          attributes: {
            title: "changed_title",
            description: "test_description",
            source: 'input = gets.chomp\nputs "test #{input}',
            difficulty: "difficult",
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
                id: "70",
                type: "user",
              },
            },
          },
        },
      };

      msw.use(
        http.patch(`${apiUrl}/api/v1/user/sangakus/1`, () => {
          return HttpResponse.json(backendResponse, { status: 200 });
        }),
      );

      // NOTE: test start
      await setSession(page);

      await page.goto("/user/sangakus/1/edit");
      await page.waitForLoadState();
      await page.getByLabel("タイトル").fill("test_changed");
      await page.getByLabel("問題文").fill("changed_description");
      const monacoEditor = page.locator(".monaco-editor").nth(0);
      await monacoEditor.click();
      await page.keyboard.press("Meta+KeyA");
      await page.keyboard.press("Backspace");
      await page.keyboard.type("input = gets.chomp");
      await page.keyboard.press("Enter");
      await page.keyboard.type('puts "test changed #{input}"');
      await page.getByRole("button", { name: "確認画面へ" }).click();
      await page.waitForLoadState();
      const readOnlyEditor = page
        .locator(".MuiModal-root")
        .locator(".monaco-editor");
      await expect(readOnlyEditor).toBeVisible();
      const resultText = page.getByLabel("result-1");
      await expect(resultText).toBeVisible();
      await page.getByRole("button", { name: "保存する" }).click();
      await expect(page).toHaveURL("/user/sangakus");
      const flash = page.getByText("算額を更新しました");
      await expect(flash).toBeVisible();
    });

    test("should display notFound page", async ({ page }) => {
      await setSession(page);

      page.goto("/user/sangakus/999/edit");
      const message = page.getByRole("heading", {
        name: "This page could not be found.",
      });
      await expect(message).toBeVisible();
    });
  });
});
