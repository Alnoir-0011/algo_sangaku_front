import { setSession } from "@/tests/__helpers__/signin";
import {
  test,
  expect,
  http,
  HttpResponse,
  passthrough,
} from "next/experimental/testmode/playwright/msw";

test.describe("/saved_sangakus/[id]/answer", () => {
  test.describe("before signin", () => {
    test("should not allow me to show answer", async ({ page }) => {
      await page.goto("/saved_sangakus/1/answer");
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

    test("should allow me to show answer", async ({ page }) => {
      await setSession(page);
      await page.goto("/saved_sangakus/1/answer");
      await expect(page).toHaveURL("/saved_sangakus/1/answer");
      const heading = page.getByRole("heading", { name: "test_titleの結果" });
      await expect(heading).toBeVisible();
      const output = page.getByLabel("result-1");
      await expect(output).toBeVisible();
    });
  });
});
