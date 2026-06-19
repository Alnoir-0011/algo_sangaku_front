import { setSession } from "@/tests/__helpers__/signin";
import {
  test,
  expect,
  http,
  HttpResponse,
  passthrough,
} from "@/tests/e2e/fixtures.msw";

const apiUrl = process.env.API_URL;

test.describe("/saved_sangakus", () => {
  test.describe("before signin", () => {
    test("should not allow me to visit /saved_sangakus", async ({ page }) => {
      await page.goto("/saved_sangakus");
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
          http.get(`${apiUrl}/api/v1/user/saved_sangakus`, ({ request }) => {
            const url = new URL(request.url);
            const type = url.searchParams.get("type");
            if (type !== "answered") {
              return HttpResponse.json(
                {
                  data: [
                    {
                      id: "1",
                      type: "sangaku",
                      attributes: {
                        title: "test_title",
                        description: "test_desc",
                        source: "puts 'hi'",
                        difficulty: "normal",
                        inputs: [
                          {
                            id: 1,
                            content: "input",
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
                          data: null,
                        },
                      },
                    },
                  ],
                },
                {
                  status: 200,
                  headers: {
                    "Content-Type": "application/json",
                    "current-page": "1",
                    "page-items": "20",
                    "total-pages": "1",
                    "total-count": "1",
                  },
                },
              );
            } else {
              return HttpResponse.json(
                {
                  data: [
                    {
                      id: "1",
                      type: "sangaku",
                      attributes: {
                        title: "answered",
                        description: "test_desc",
                        source: "puts 'hi'",
                        difficulty: "normal",
                        inputs: [
                          {
                            id: 1,
                            content: "input",
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
                          data: null,
                        },
                      },
                    },
                  ],
                },
                {
                  status: 200,
                  headers: {
                    "Content-Type": "application/json",
                    "current-page": "1",
                    "page-items": "20",
                    "total-pages": "1",
                    "total-count": "1",
                  },
                },
              );
            }
          }),
          // allow all non-mocked routes to pass through
          http.all("*", () => {
            return passthrough();
          }),
        ],
        { scope: "test" }, // or 'worker'
      ],
    });

    test("should allow me to see saved sangakus list", async ({ page }) => {
      await setSession(page);
      await page.goto("/saved_sangakus");
      await expect(page).toHaveURL("/saved_sangakus");
      const sangakuTitle = page.getByRole("heading", { name: "test_title" });
      await expect(sangakuTitle).toBeVisible({ timeout: 10_000 });
    });

    test("should allow me to see answered sangakus list", async ({ page }) => {
      await setSession(page);
      await page.goto("/saved_sangakus?tab=answered");
      await expect(page).toHaveURL("/saved_sangakus?tab=answered");
      const sangakuTitle = page.getByRole("heading", { name: "answered" });
      await expect(sangakuTitle).toBeVisible({ timeout: 10_000 });
    });

    test("should allow me to see easy difficulty label", async ({ page, msw }) => {
      msw.use(
        http.get(`${apiUrl}/api/v1/user/saved_sangakus`, () => {
          return new HttpResponse(
            JSON.stringify({
              data: [
                {
                  id: "4",
                  type: "sangaku",
                  attributes: {
                    title: "簡単な算額",
                    description: "test",
                    source: "",
                    difficulty: "easy",
                    inputs: [],
                    author_name: "user",
                  },
                  relationships: {
                    user: { data: { id: "1", type: "user" } },
                    shrine: { data: null },
                  },
                },
              ],
            }),
            {
              status: 200,
              headers: {
                "Content-Type": "application/json",
                "current-page": "1",
                "page-items": "20",
                "total-pages": "1",
                "total-count": "1",
              },
            },
          );
        }),
      );

      await setSession(page);
      await page.goto("/saved_sangakus");

      const main = page.locator("main");
      await expect(main.getByText("簡単", { exact: true }).first()).toBeVisible({
        timeout: 10_000,
      });
    });

    test("should allow me to see difficult and very_difficult difficulty labels", async ({
      page,
      msw,
    }) => {
      msw.use(
        http.get(`${apiUrl}/api/v1/user/saved_sangakus`, () => {
          return new HttpResponse(
            JSON.stringify({
              data: [
                {
                  id: "2",
                  type: "sangaku",
                  attributes: {
                    title: "難しい算額",
                    description: "test",
                    source: "",
                    difficulty: "difficult",
                    inputs: [],
                    author_name: "user",
                  },
                  relationships: {
                    user: { data: { id: "1", type: "user" } },
                    shrine: { data: null },
                  },
                },
                {
                  id: "3",
                  type: "sangaku",
                  attributes: {
                    title: "とても難しい算額",
                    description: "test",
                    source: "",
                    difficulty: "very_difficult",
                    inputs: [],
                    author_name: "user",
                  },
                  relationships: {
                    user: { data: { id: "1", type: "user" } },
                    shrine: { data: null },
                  },
                },
              ],
            }),
            {
              status: 200,
              headers: {
                "Content-Type": "application/json",
                "current-page": "1",
                "page-items": "20",
                "total-pages": "1",
                "total-count": "2",
              },
            },
          );
        }),
      );

      await setSession(page);
      await page.goto("/saved_sangakus");

      const main = page.locator("main");
      await expect(main.getByText("難しい", { exact: true }).first()).toBeVisible({
        timeout: 10_000,
      });
      await expect(main.getByText("とても難しい", { exact: true }).first()).toBeVisible({
        timeout: 10_000,
      });
    });

    test("should allow me to filter sangakus by search text", async ({ page }) => {
      await setSession(page);
      await page.goto("/saved_sangakus");

      const searchInput = page.getByPlaceholder("タイトルで探す");
      await searchInput.fill("検索文字");
      await expect(page).toHaveURL(/query=%E6%A4%9C%E7%B4%A2%E6%96%87%E5%AD%97/, {
        timeout: 10_000,
      });

      await searchInput.fill("");
      await expect(page).not.toHaveURL(/query=/, { timeout: 3_000 });
    });

    test("should allow me to filter sangakus by difficulty", async ({ page }) => {
      await setSession(page);
      await page.goto("/saved_sangakus");

      // 難易度セレクトをクリックして「難しい」を選択
      await page.getByRole("combobox", { name: "難易度" }).click();
      await page.getByRole("option", { name: "難しい", exact: true }).click();
      await expect(page).toHaveURL(/difficulty=difficult/, { timeout: 3_000 });

      // 「全て」に戻す
      await page.getByRole("combobox", { name: "難易度" }).click();
      await page.getByRole("option", { name: "全て" }).click();
      await expect(page).not.toHaveURL(/difficulty=/, { timeout: 3_000 });
    });
  });
});
