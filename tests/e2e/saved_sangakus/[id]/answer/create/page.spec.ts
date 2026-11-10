import { setSession } from "@/tests/__helpers__/signin";
import { getMonacoEditorValue, setMonacoEditorValue, waitForHydration, waitForMonacoEditor } from "@/tests/__helpers__/hydration";
import {
  test,
  expect,
  http,
  HttpResponse,
  passthrough,
} from "@/tests/e2e/fixtures.msw";

const apiUrl = process.env.API_URL;

test.describe("/saved_sangakus/[id]/answer/create", () => {
  test.describe("before signin", () => {
    test("should not allow me to access create answer page without signing in", async ({ page }) => {
      await page.goto("/saved_sangakus/1/answer/create");
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
          http.get(`${apiUrl}/api/v1/user/saved_sangakus/1`, () => {
            return HttpResponse.json(
              {
                data: {
                  id: "1",
                  type: "sangaku",
                  attributes: {
                    title: "test_title",
                    description: "test_desc",
                    source: "input = gets.chomp\nputs input",
                    difficulty: "normal",
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
          http.post(`${apiUrl}/api/v1/user/saved_sangakus/1/answer`, () => {
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
          http.get(`${apiUrl}/api/v1/user/saved_sangakus/1/answer`, () => {
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
          }),
          http.get(`${apiUrl}/api/v1/user/answers/1`, () => {
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
          http.get(`${apiUrl}/api/v1/user/answer_results/1`, () => {
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

    test("should allow me to submit answer and navigate to result page", async ({ page }) => {
      await setSession(page);
      await page.goto("/saved_sangakus/1/answer/create");
      const title = page.getByRole("heading", { name: "test_title" });
      await expect(title).toBeVisible();
      const description = page.getByText("test_desc");
      await expect(description).toBeVisible();
      await waitForMonacoEditor(page);
      await setMonacoEditorValue(page, "input = gets.chomp\n\nputs input");
      await expect
        .poll(() => getMonacoEditorValue(page))
        .toBe("input = gets.chomp\n\nputs input");
      const button = page.getByRole("button", { name: "解答を終了する" });
      page.once("dialog", async (dialog) => {
        await dialog.accept();
      });
      await button.click();
      await expect(page).toHaveURL("/saved_sangakus/1/answer");
      const heading = page.getByRole("heading", { name: "test_titleの結果" });
      await expect(heading).toBeVisible();
      const output = page.getByTestId("result-1");
      await expect(output).toBeVisible();
      await expect(output).toContainText("test");
    });

    test("should not allow me to submit an answer twice when I double-click the end-answer button", async ({ page, msw }) => {
      const responseDelayMs = 1500;
      let answerCount = 0;
      msw.use(
        http.post(`${apiUrl}/api/v1/user/saved_sangakus/1/answer`, async () => {
          answerCount += 1;
          await new Promise((resolve) => setTimeout(resolve, responseDelayMs));
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
                  user_sangaku_save: { data: { id: "1", type: "user_sangaku_save" } },
                  answer_result: { data: [{ id: "1", type: "answer_result" }] },
                },
              },
            },
            { status: 200 },
          );
        }),
      );
      await setSession(page);
      await page.goto("/saved_sangakus/1/answer/create");
      await expect(page.getByRole("heading", { name: "test_title" })).toBeVisible();
      await waitForMonacoEditor(page);
      await setMonacoEditorValue(page, "input = gets.chomp\n\nputs input");
      const button = page.getByRole("button", { name: "解答を終了する" });
      await waitForHydration(button);
      page.on("dialog", async (dialog) => {
        await dialog.accept();
      });

      await button.dblclick();

      await expect(page).toHaveURL("/saved_sangakus/1/answer");
      // 2回目の送信は、1回目の応答のあとに届く。「送られないこと」は待たないと確認できない
      await page.waitForTimeout(responseDelayMs + 500);
      expect(answerCount).toBe(1);
    });

    test("should not allow me to end answer when confirm is dismissed", async ({
      page,
    }) => {
      await setSession(page);
      await page.goto("/saved_sangakus/1/answer/create");
      await waitForMonacoEditor(page);
      await page.evaluate(() => {
        window.confirm = () => false;
      });
      const button = page.getByRole("button", { name: "解答を終了する" });
      await button.click();
      await expect(page).toHaveURL("/saved_sangakus/1/answer/create");
    });

    test("should not allow me to create answer without source", async ({
      page,
      msw,
    }) => {
      msw.use(
        http.post(`${apiUrl}/api/v1/user/saved_sangakus/1/answer`, () => {
          return HttpResponse.json(
            {
              message: "Bad Request",
              errors: [["source", ["を入力してください"]]],
            },
            { status: 400 },
          );
        }),
      );
      await setSession(page);
      await page.goto("/saved_sangakus/1/answer/create");
      const title = page.getByRole("heading", { name: "test_title" });
      await expect(title).toBeVisible();
      const description = page.getByText("test_desc");
      await expect(description).toBeVisible();
      await waitForMonacoEditor(page);
      await setMonacoEditorValue(page, "");
      await expect.poll(() => getMonacoEditorValue(page)).toBe("");
      const button = page.getByRole("button", { name: "解答を終了する" });
      page.once("dialog", async (dialog) => {
        await dialog.accept();
      });
      await button.click();
      await expect(page).toHaveURL("/saved_sangakus/1/answer/create");
      const errorMessage = page.getByLabel("sourceError");
      await expect(errorMessage).toBeVisible();
    });

    test("should not allow me to submit an answer for an already-answered sangaku", async ({
      page,
      msw,
    }) => {
      msw.use(
        http.post(`${apiUrl}/api/v1/user/saved_sangakus/1/answer`, () => {
          return HttpResponse.json(
            { message: "Conflict" },
            { status: 409 },
          );
        }),
      );
      await setSession(page);
      await page.goto("/saved_sangakus/1/answer/create");
      await waitForMonacoEditor(page);
      await setMonacoEditorValue(page, "input = gets.chomp\n\nputs input");
      await expect
        .poll(() => getMonacoEditorValue(page))
        .toBe("input = gets.chomp\n\nputs input");
      const button = page.getByRole("button", { name: "解答を終了する" });
      page.once("dialog", async (dialog) => {
        await dialog.accept();
      });
      await button.click();
      const flash = page.getByTestId("flash-message");
      await expect(flash).toBeVisible({ timeout: 10_000 });
      await expect(flash).toContainText("この算額にはすでに解答済みです");
    });

    test("should allow me to see PaizaIO output after clicking the run button", async ({
      page,
      msw,
    }) => {
      msw.use(
        http.post("https://api.paiza.io/runners/create.json", () => {
          return HttpResponse.json({ id: "paiza-run-id" });
        }),
        http.get("https://api.paiza.io/runners/get_status.json", () => {
          return HttpResponse.json({ status: "completed" });
        }),
        http.get("https://api.paiza.io/runners/get_details.json", () => {
          return HttpResponse.json({
            build_stdout: null,
            build_stderr: null,
            stdout: "paiza mock output\n",
            stderr: null,
          });
        }),
      );

      await setSession(page);
      await page.goto("/saved_sangakus/1/answer/create");
      await waitForMonacoEditor(page);
      await page.getByRole("button", { name: "実行" }).click();
      const output = page.getByLabel("出力");
      await expect(output).toHaveValue("paiza mock output\n", { timeout: 10_000 });
    });

    test.describe("when sangaku kind is reorder", () => {
      test.use({
        mswHandlers: [
          [
            http.get(`${apiUrl}/api/v1/user/saved_sangakus/2`, () => {
              return HttpResponse.json(
                {
                  data: {
                    id: "2",
                    type: "sangaku",
                    attributes: {
                      title: "reorder_title",
                      description: "reorder_desc",
                      difficulty: "normal",
                      inputs: [],
                      author_name: "another_user",
                      kind: "reorder",
                      code_blocks: [
                        { id: 1, content: "block1" },
                        { id: 2, content: "block2" },
                        { id: 3, content: "block3" },
                        { id: 4, content: "block4" },
                        { id: 5, content: "block5" },
                        { id: 6, content: "block6" },
                      ],
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
            // allow all non-mocked routes to pass through
            http.all("*", () => {
              return passthrough();
            }),
          ],
          { scope: "test" },
        ],
      });

      test("should allow me to see ReorderPuzzle when sangaku kind is reorder", async ({
        page,
      }) => {
        await setSession(page);
        await page.goto("/saved_sangakus/2/answer/create");
        const title = page.getByRole("heading", { name: "reorder_title" });
        await expect(title).toBeVisible();
        const unusedBlocksArea = page.getByTestId("unused-blocks-area");
        await expect(unusedBlocksArea).toBeVisible();
        const moveToAnswerButton = page
          .getByRole("button", { name: "解答エリアへ移動" })
          .first();
        await expect(moveToAnswerButton).toBeVisible();
      });

      // toPuzzleBlocks は、入力が昇順のとき昇順のまま返さない。ページが呼び忘れると、
      // API が返した昇順のまま表示されるため、確率に頼らずに検知できる。
      test("should not allow me to see the blocks in the order returned by the API", async ({
        page,
      }) => {
        await setSession(page);
        await page.goto("/saved_sangakus/2/answer/create");
        const unusedBlocksArea = page.getByTestId("unused-blocks-area");
        await expect(unusedBlocksArea.getByTestId("block-item")).toHaveCount(6);

        const displayed = await unusedBlocksArea
          .getByText(/^block\d$/)
          .allTextContents();

        expect(displayed).toHaveLength(6);
        expect(displayed).not.toEqual([
          "block1",
          "block2",
          "block3",
          "block4",
          "block5",
          "block6",
        ]);
      });

      test("should not allow me to see a hydration error when I open the reorder puzzle", async ({
        page,
      }) => {
        const hydrationErrors: string[] = [];
        const collect = (message: string) => {
          if (/hydrat|Minified React error #(418|423|425)/i.test(message)) {
            hydrationErrors.push(message);
          }
        };
        page.on("console", (message) => {
          if (message.type() === "error") collect(message.text());
        });
        page.on("pageerror", (error) => collect(error.message));
        await setSession(page);

        await page.goto("/saved_sangakus/2/answer/create");
        await waitForHydration(page.getByTestId("unused-blocks-area"));
        await expect(page.getByTestId("block-item")).toHaveCount(6);

        expect(hydrationErrors).toEqual([]);
      });
    });
  });
});
