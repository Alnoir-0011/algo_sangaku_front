import { setSession } from "@/tests/__helpers__/signin";
import {
  test,
  expect,
  http,
  HttpResponse,
  passthrough,
} from "next/experimental/testmode/playwright/msw";

test.describe("/saved_sangakus/[id]/answer/create", () => {
  test.describe("before signin", () => {
    test("should not allow me to create answer", async ({ page }) => {
      await page.goto("/saved_sangakus/1/answer/create");
      await expect(page).toHaveURL("/signin");
      const flash = page.getByText("サインインしてください");
      await expect(flash).toBeVisible();
    });
  });

  test.describe("after signin", () => {
    test.use({
      mswHandlers: [
        [
          http.get("http://localhost:3000/api/v1/user/saved_sangakus/1", () => {
            return HttpResponse.json(
              {
                data: {
                  id: "1",
                  type: "sangaku",
                  attributes: {
                    title: "test_title",
                    description: "test_desc",
                    source: "input = gets.chomp\nputs input",
                    difficulty: "nomal",
                    inputs: [
                      {
                        id: 1,
                        content: "test",
                      },
                    ],
                    author_name: "another_user",
                  },
                  relationships: {
                    user: {
                      data: {
                        id: "1",
                        type: "user",
                      },
                    },
                    shrine: {
                      data: {
                        id: "1",
                        type: "shrine",
                      },
                    },
                  },
                },
              },
              {
                status: 200,
                headers: {
                  "Content-Type": "application/json",
                },
              },
            );
          }),
          http.post(
            "http://localhost:3000/api/v1/user/sangakus/1/answers",
            () => {
              return HttpResponse.json(
                {
                  data: {
                    id: "1",
                    type: "answer",
                    attributes: {
                      source: "input = gets.chomp\nputs input",
                      status: "correct",
                    },
                    relationships: {
                      user_sangaku_save: {
                        data: {
                          id: "1",
                          type: "user_sangaku_save",
                        },
                      },
                      answer_result: {
                        data: [
                          {
                            id: "1",
                            type: "answer_result",
                          },
                        ],
                      },
                    },
                  },
                },
                {
                  status: 200,
                  headers: {
                    "Content-Type": "application/json",
                  },
                },
              );
            },
          ),
          http.get(
            "http://localhost:3000/api/v1/user/saved_sangakus/1/answer",
            () => {
              return HttpResponse.json(
                {
                  data: {
                    id: "1",
                    type: "answer",
                    attributes: {
                      source: "input = gets.chomp\nputs input",
                      status: "correct",
                    },
                    relationships: {
                      user_sangaku_save: {
                        data: {
                          id: "1",
                          type: "user_sangaku_save",
                        },
                      },
                      answer_results: {
                        data: [
                          {
                            id: "1",
                            type: "answer_result",
                          },
                        ],
                      },
                    },
                  },
                },
                {
                  status: 200,
                  headers: {
                    "Content-Type": "application/json",
                  },
                },
              );
            },
          ),
          http.get("http://localhost:3000/api/v1/user/answers/1", () => {
            return HttpResponse.json(
              {
                data: {
                  id: "1",
                  type: "answer",
                  attributes: {
                    source: "input = gets.chomp\nputs input",
                    status: "correct",
                  },
                  relationships: {
                    user_sangaku_save: {
                      data: {
                        id: "1",
                        type: "user_sangaku_save",
                      },
                    },
                    answer_result: {
                      data: [
                        {
                          id: "1",
                          type: "answer_result",
                        },
                      ],
                    },
                  },
                },
              },
              {
                status: 200,
                headers: {
                  "Content-Type": "application/json",
                },
              },
            );
          }),
          http.get("http://localhost:3000/api/v1/user/answer_results/1", () => {
            return HttpResponse.json(
              {
                data: {
                  id: "1",
                  type: "answer_result",
                  attributes: {
                    output: "test\n",
                    status: "correct",
                    fixed_input_content: "test",
                  },
                  relationships: {
                    answer: {
                      data: {
                        id: "1",
                        type: "answer",
                      },
                    },
                    fixed_input: {
                      data: {
                        id: "1",
                        type: "fixed_input",
                      },
                    },
                  },
                },
              },
              {
                status: 200,
                headers: {
                  "Content-Type": "application/json",
                },
              },
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

    test.describe("after signin", () => {
      test("should allow me to create answer", async ({ page }) => {
        await setSession(page);
        await page.goto("/saved_sangakus/1/answer/create");
        const title = page.getByRole("heading", { name: "test_title" });
        await expect(title).toBeVisible();
        const description = page.getByText("test_desc");
        await expect(description).toBeVisible();
        const monacoEditor = page.locator(".monaco-editor").nth(0);
        await monacoEditor.click();
        await page.keyboard.press("Meta+KeyA");
        await page.keyboard.press("Backspace");
        await page.keyboard.type("input = gets.chomp");
        await page.keyboard.press("Enter");
        await page.keyboard.press("Enter");
        await page.keyboard.type("puts input");
        const button = page.getByRole("button", { name: "解答を終了する" });
        page.once("dialog", async (dialog) => {
          await dialog.accept();
        });
        await button.click();
        await expect(page).toHaveURL("/saved_sangakus/1/answer");
        const heading = page.getByRole("heading", { name: "test_titleの結果" });
        await expect(heading).toBeVisible();
      });

      test("should not allow me to create answer without source", async ({
        page,
        msw,
      }) => {
        msw.use(
          http.post(
            "http://localhost:3000/api/v1/user/sangakus/1/answers",
            () => {
              return HttpResponse.json(
                {
                  message: "Bad Request",
                  errors: [["source", ["を入力してください"]]],
                },
                { status: 400 },
              );
            },
          ),
        );
        await setSession(page);
        await page.goto("/saved_sangakus/1/answer/create");
        const title = page.getByRole("heading", { name: "test_title" });
        await expect(title).toBeVisible();
        const description = page.getByText("test_desc");
        await expect(description).toBeVisible();
        const monacoEditor = page.locator(".monaco-editor").nth(0);
        await monacoEditor.click();
        await page.keyboard.press("Meta+KeyA");
        await page.keyboard.press("Backspace");
        const button = page.getByRole("button", { name: "解答を終了する" });
        page.once("dialog", async (dialog) => {
          await dialog.accept();
        });
        await button.click();
        await expect(page).toHaveURL("/saved_sangakus/1/answer/create");
        const errorMessage = page.getByLabel("sourceError");
        await expect(errorMessage).toBeVisible();
      });
    });
  });
});
