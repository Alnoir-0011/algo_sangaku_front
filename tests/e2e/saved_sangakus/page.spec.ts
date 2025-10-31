import { setSession } from "@/tests/__helpers__/signin";
import {
  test,
  expect,
  http,
  HttpResponse,
  passthrough,
} from "next/experimental/testmode/playwright/msw";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

test.describe("/saved_sangakus", () => {
  test.describe("before singin", () => {
    test("should not allow me to visit /saved_sangakus", async ({ page }) => {
      await page.goto("/answers");
      await expect(page).toHaveURL("/signin");
      const flash = page.getByText("サインインしてください");
      await expect(flash).toBeVisible();
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
                        difficulty: "nomal",
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
                        difficulty: "nomal",
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

    test("should allow me to show saved_sangakus", async ({ page }) => {
      await setSession(page);
      await page.goto("/saved_sangakus");
      await expect(page).toHaveURL("/saved_sangakus");
      const sangakuTitle = page.getByRole("heading", { name: "test_title" });
      await expect(sangakuTitle).toBeVisible();
    });

    test("should allow me to show answered sangakus", async ({ page }) => {
      await setSession(page);
      await page.goto("/saved_sangakus?tab=answered");
      await expect(page).toHaveURL("/saved_sangakus?tab=answered");
      const sangakuTitle = page.getByRole("heading", { name: "answered" });
      await expect(sangakuTitle).toBeVisible();
    });
  });
});
