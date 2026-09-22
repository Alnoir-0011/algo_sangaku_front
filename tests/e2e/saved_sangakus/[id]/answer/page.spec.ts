import { setSession } from "@/tests/__helpers__/signin";
import {
  test,
  expect,
  http,
  HttpResponse,
  passthrough,
} from "@/tests/e2e/fixtures.msw";

const apiUrl = process.env.API_URL;

test.describe("/saved_sangakus/[id]/answer", () => {
  test.describe("before signin", () => {
    test("should not allow me to see answer without signing in", async ({ page }) => {
      await page.goto("/saved_sangakus/1/answer");
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
                    kind: "code",
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
          http.get(`${apiUrl}/api/v1/user/saved_sangakus/1/answer`, () => {
            return HttpResponse.json(
              {
                data: {
                  id: "1",
                  type: "answer",
                  attributes: {
                    source: "input = gets.chomp\nputs input",
                    status: "correct",
                    kind: "code",
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
                    kind: "code",
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

    test("should allow me to see answer result when the answer is correct", async ({ page }) => {
      await setSession(page);
      await page.goto("/saved_sangakus/1/answer");
      const heading = page.getByRole("heading", { name: "test_titleの結果" });
      await expect(heading).toBeVisible();
      const output = page.getByTestId("result-1");
      await expect(output).toBeVisible();
      await expect(output).toContainText("test");
    });

    test("should allow me to see the read-only code editor when kind is code", async ({
      page,
    }) => {
      // kind: "code"（従来どおりの形式）でエディタが表示され続けることを
      // 明示的な回帰ガードとして固定する。実装が壊れて非表示条件が
      // 誤って code 側にも波及した場合にここで検知できるようにする。
      //
      // Monaco Editor は非同期に初期化されるため、表示直後に .monaco-editor
      // の個数を確認すると、まだ描画されていないだけの状態を誤って
      // 未表示と判定してしまう可能性がある。SourceResult のポーリングが
      // 確定表示（明察/誤謬）に達するのを待つことで、同じページ内で
      // 先にマウントされる ReadOnlyEditor の初期化も十分完了しているとみなせる
      // 状態にしてから判定する。
      await setSession(page);
      await page.goto("/saved_sangakus/1/answer");
      const heading = page.getByRole("heading", { name: "test_titleの結果" });
      await expect(heading).toBeVisible();
      await expect(page.getByText("明察")).toBeVisible();
      const codeEditor = page.locator(".monaco-editor");
      await expect(codeEditor).toHaveCount(1);
    });
  });

  test.describe("after signin (kind: reorder)", () => {
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
                    title: "reorder_test_title",
                    description: "test_desc",
                    difficulty: "normal",
                    inputs: [
                      {
                        id: 1,
                        content: "test",
                      },
                    ],
                    author_name: "another_user",
                    kind: "reorder",
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
          http.get(`${apiUrl}/api/v1/user/saved_sangakus/2/answer`, () => {
            return HttpResponse.json(
              {
                data: {
                  id: "2",
                  type: "answer",
                  attributes: {
                    source: null,
                    status: "correct",
                    kind: "reorder",
                  },
                  relationships: {
                    user_sangaku_save: {
                      data: {
                        id: "2",
                        type: "user_sangaku_save",
                      },
                    },
                    // ReorderAnswer は answer_results を持たないため、
                    // back の AnswerSerializer は空配列を返す契約に合わせる
                    answer_results: {
                      data: [],
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
          http.get(`${apiUrl}/api/v1/user/answers/2`, () => {
            return HttpResponse.json(
              {
                data: {
                  id: "2",
                  type: "answer",
                  attributes: {
                    source: null,
                    status: "correct",
                    kind: "reorder",
                  },
                  relationships: {
                    user_sangaku_save: {
                      data: {
                        id: "2",
                        type: "user_sangaku_save",
                      },
                    },
                    answer_result: {
                      data: [
                        {
                          id: "2",
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
          http.get(`${apiUrl}/api/v1/user/answer_results/2`, () => {
            return HttpResponse.json(
              {
                data: {
                  id: "2",
                  type: "answer_result",
                  attributes: {
                    output: "test\n",
                    status: "correct",
                    fixed_input_content: "test",
                  },
                  relationships: {
                    answer: {
                      data: {
                        id: "2",
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

    test("should allow me to see the correct answer code in a read-only editor when the reorder sangaku has been answered", async ({
      page,
      msw,
    }) => {
      // back は解答済みの場合に限り、code_blocks に correct_position を含めて
      // 正解順（ダミーはその後ろ）で返す（issue #92）。この解答済みレスポンスを
      // 再現し、正解コードがダミーを除いて correct_position 順に結合された状態で
      // エディタに表示されることを検証する。
      msw.use(
        http.get(`${apiUrl}/api/v1/user/saved_sangakus/2`, () => {
          return HttpResponse.json(
            {
              data: {
                id: "2",
                type: "sangaku",
                attributes: {
                  title: "reorder_test_title",
                  description: "test_desc",
                  difficulty: "normal",
                  inputs: [{ id: 1, content: "test" }],
                  author_name: "another_user",
                  kind: "reorder",
                  code_blocks: [
                    { id: 1, content: "puts 1", correct_position: 1 },
                    { id: 2, content: "puts 2", correct_position: 2 },
                    { id: 3, content: "puts 999", correct_position: null },
                  ],
                },
                relationships: {
                  user: { data: { id: "1", type: "user" } },
                  shrine: { data: { id: "1", type: "shrine" } },
                },
              },
            },
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        }),
      );

      await setSession(page);
      await page.goto("/saved_sangakus/2/answer");
      const heading = page.getByRole("heading", {
        name: "reorder_test_titleの結果",
      });
      await expect(heading).toBeVisible();
      await expect(page.getByText("明察")).toBeVisible();

      const editorLines = page.locator(".monaco-editor").locator(".view-lines");
      await editorLines.waitFor({ state: "visible", timeout: 10_000 });
      await expect(editorLines).toContainText("puts 1");
      await expect(editorLines).toContainText("puts 2");
      await expect(editorLines).not.toContainText("puts 999");
    });

    test("should not allow me to see the read-only code editor when the reorder sangaku's code_blocks contain no correct_position", async ({
      page,
    }) => {
      // このテストの saved_sangakus/2 モック（describe 直下の mswHandlers）は
      // code_blocks 自体を持たない = back から正解コードの元データが来ていない
      // 状態を表す。buildCorrectAnswerSource が空文字列を返すため、
      // 正解コードを組み立てられず ReadOnlyEditor は表示されない。
      //
      // Monaco Editor は非同期に初期化されるため、表示直後に .monaco-editor の
      // 個数を確認すると、まだ描画されていないだけの「0件」を誤って正解として
      // 検出してしまう（toHaveCount は「後から増えないこと」までは保証しない）。
      // SourceResult のポーリングが確定表示（明察/誤謬）に達するのを待つことで、
      // 同じページ内で先にマウントされる ReadOnlyEditor の初期化も
      // 十分完了しているとみなせる状態にしてから判定する。
      await setSession(page);
      await page.goto("/saved_sangakus/2/answer");
      const heading = page.getByRole("heading", {
        name: "reorder_test_titleの結果",
      });
      await expect(heading).toBeVisible();
      await expect(page.getByText("明察")).toBeVisible();
      const codeEditor = page.locator(".monaco-editor");
      await expect(codeEditor).toHaveCount(0);
    });

    test("should not allow me to see the results table when kind is reorder", async ({
      page,
    }) => {
      // SourceResult のポーリングが確定表示（明察/誤謬）に達するのを待ってから
      // 判定することで、非同期処理がまだ完了していないだけの状態を
      // 「表が存在しない」と誤検出することを避ける。
      await setSession(page);
      await page.goto("/saved_sangakus/2/answer");
      const heading = page.getByRole("heading", {
        name: "reorder_test_titleの結果",
      });
      await expect(heading).toBeVisible();
      await expect(page.getByText("明察")).toBeVisible();
      // ページ見出し「reorder_test_titleの結果」に「結果」が部分一致するため、
      // Results コンポーネントのヘッダーとの誤検出を避けるため exact 指定する
      await expect(page.getByText("出力", { exact: true })).toHaveCount(0);
      await expect(page.getByText("結果", { exact: true })).toHaveCount(0);
    });
  });
});
