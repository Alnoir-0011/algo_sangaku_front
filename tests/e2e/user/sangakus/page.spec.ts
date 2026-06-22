import { setSession } from "@/tests/__helpers__/signin";
import { waitForInteractive } from "@/tests/__helpers__/hydration";
import {
  test,
  expect,
  http,
  HttpResponse,
  passthrough,
} from "@/tests/e2e/fixtures.msw";

const apiUrl = process.env.API_URL;

const beforeDedicateSangakus = {
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
};

const alreadyDedicateSangakus = {
  data: [
    {
      id: "1",
      type: "sangaku",
      attributes: {
        title: "dedicated",
        description: "test_desc",
        source: "puts 'hi'",
        difficulty: "normal",
        inputs: [
          {
            id: 1,
            content: "input",
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
        shrine: {
          data: {
            id: "1",
            type: "shrine",
          },
        },
      },
    },
  ],
};

const deleteResponse = {
  data: {
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
};

test.describe("/user/sangakus", () => {
  test.use({
    mswHandlers: [
      [
        http.get(`${apiUrl}/api/v1/user/sangakus`, ({ request }) => {
          const url = new URL(request.url);
          const shrineId = url.searchParams.get("shrine_id");
          if (shrineId === "") {
            return new HttpResponse(JSON.stringify(beforeDedicateSangakus), {
              status: 200,
              headers: {
                "Content-Type": "application/json",
                "current-page": "1",
                "page-items": "20",
                "total-pages": "2",
                "total-count": "22",
              },
            });
          } else {
            return new HttpResponse(JSON.stringify(alreadyDedicateSangakus), {
              status: 200,
              headers: {
                "Content-Type": "application/json",
                "current-page": "1",
                "page-items": "20",
                "total-pages": "2",
                "total-count": "22",
              },
            });
          }
        }),
        http.delete(`${apiUrl}/api/v1/user/sangakus/1`, () => {
          return new HttpResponse(JSON.stringify(deleteResponse), {
            status: 200,
          });
        }),
        http.get(`${apiUrl}/api/v1/user/sangakus/1/result`, () => {
          return HttpResponse.json(
            {
              data: {
                attributes: {
                  user_sangaku_save_count: 10,
                  correct_count: 7,
                  incorrect_count: 3,
                },
              },
            },
            { status: 200 },
          );
        }),
        http.get(`${apiUrl}/api/v1/shrines/1`, () => {
          return HttpResponse.json(
            {
              data: {
                id: "1",
                type: "shrine",
                attributes: {
                  name: "test_shrine",
                  address: "test_address",
                  latitude: 35.70204829610801,
                  longitude: 139.76789333814216,
                  place_id: "test_place_id_1",
                },
              },
            },
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

  test.describe("before signin", () => {
    test("should not allow me to visit my sangakus page without signing in and redirect to signin", async ({ page }) => {
      await page.goto("/user/sangakus");
      await expect(page).toHaveURL("/signin");
      const flash = page.getByTestId('flash-message');
      await expect(flash).toBeVisible({ timeout: 10_000 });
      await expect(flash).toContainText("サインインしてください");
      const mainNode = page.locator("main");
      const heading = mainNode.getByRole("heading", { name: "サインイン" });
      await expect(heading).toBeVisible();
    });

    test("should allow me to see sign in button in nav after redirect to signin", async ({ page }) => {
      await page.goto("/user/sangakus");
      await expect(page).toHaveURL("/signin");
      await page.reload();
      const drawer = page.getByRole("navigation");
      const link = drawer.getByRole("button", { name: "サインイン" });
      await expect(link).toBeVisible();
    });
  });

  test.describe("after signin", () => {
    test("should allow me to see my sangaku title", async ({ page }) => {
      await setSession(page);
      await page.goto("/user/sangakus");
      await expect(page.getByRole("heading", { name: "test_title" })).toBeVisible();
    });

    test("should allow me to see the edit link with correct href in sangaku menu", async ({ page }) => {
      await setSession(page);
      await page.goto("/user/sangakus");
      // サインイン直後のクライアント遷移で前ページの DOM が一時的に重複するため first() で対象を絞る
      const menuButton = page.getByRole("button", { name: "算額のメニューを開く" }).first();
      await waitForInteractive(menuButton);
      await menuButton.click();
      const editLink = page.getByRole("menuitem", { name: "編集" });
      await expect(editLink).toBeVisible();
      await expect(editLink).toHaveAttribute("href", "/user/sangakus/1/edit");
    });

    test("should allow me to see the delete option in sangaku menu", async ({ page }) => {
      await setSession(page);
      await page.goto("/user/sangakus");
      const menuButton = page.getByRole("button", { name: "算額のメニューを開く" }).first();
      await waitForInteractive(menuButton);
      await menuButton.click();
      await expect(page.getByRole("menuitem", { name: "削除" })).toBeVisible();
    });

    test("should allow me to see dedicated sangaku title", async ({ page }) => {
      await setSession(page);
      await page.goto("/user/sangakus");
      await page.getByRole("tab", { name: "奉納した算額" }).click();
      await expect(page.getByRole("heading", { name: "dedicated" })).toBeVisible();
    });

    test("should not allow me to see menu for dedicated sangakus", async ({ page }) => {
      await setSession(page);
      await page.goto("/user/sangakus");
      await page.getByRole("tab", { name: "奉納した算額" }).click();
      await expect(page.getByRole("heading", { name: "dedicated" })).toBeVisible();
      await expect(page.getByRole("button", { name: "算額のメニューを開く" })).not.toBeVisible({ timeout: 3_000 });
      await expect(page.getByRole("menuitem", { name: "編集" })).not.toBeVisible({ timeout: 3_000 });
      await expect(page.getByRole("menuitem", { name: "削除" })).not.toBeVisible({ timeout: 3_000 });
    });

    test("should allow me to see shrine info when clicking a dedicated sangaku", async ({ page }) => {
      await setSession(page);
      await page.goto("/user/sangakus");
      await page.getByRole("tab", { name: "奉納した算額" }).click();
      const sangakuTitle = page.getByRole("heading", { name: "dedicated" });
      await expect(sangakuTitle).toBeVisible();
      await sangakuTitle.click();
      await expect(page.getByRole("heading", { name: "test_shrine" })).toBeVisible();
      await expect(page.getByText("算額が写された数:")).toBeVisible();
      await expect(page.getByRole("dialog").getByText("test_desc")).toBeVisible();
    });

    test("should allow me to close the dedicated sangaku modal", async ({ page }) => {
      await setSession(page);
      await page.goto("/user/sangakus");
      await page.getByRole("tab", { name: "奉納した算額" }).click();
      const sangakuTitle = page.getByRole("heading", { name: "dedicated" });
      await expect(sangakuTitle).toBeVisible();
      await sangakuTitle.click();
      await expect(page.getByRole("heading", { name: "test_shrine" })).toBeVisible();
      // Escapeキーでモーダルを閉じる
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
      await expect(page.getByRole("heading", { name: "dedicated" })).toBeVisible();
    });

    test("should allow me to delete my sangaku", async ({ page }) => {
      await setSession(page);
      await page.goto("/user/sangakus");
      // サインイン直後のクライアント遷移で前ページの DOM が一時的に重複するため first() で対象を絞る
      const menuButton = page.getByRole("button", { name: "算額のメニューを開く" }).first();
      await waitForInteractive(menuButton);
      await menuButton.click();
      const deleteButton = page.getByRole("menuitem", { name: "削除" });
      page.once("dialog", async (dialog) => {
        await dialog.accept();
      });
      await deleteButton.click();
      const flash = page.getByTestId('flash-message');
      await expect(flash).toBeVisible({ timeout: 10_000 });
      await expect(flash).toContainText("算額を削除しました");
    });

    test("should allow me to see difficult and very_difficult difficulty labels on dedicated tab", async ({
      page,
      msw,
    }) => {
      msw.use(
        http.get(`${apiUrl}/api/v1/user/sangakus`, ({ request }) => {
          const url = new URL(request.url);
          const shrineId = url.searchParams.get("shrine_id");
          if (shrineId !== "") {
            return new HttpResponse(
              JSON.stringify({
                data: [
                  {
                    id: "2",
                    type: "sangaku",
                    attributes: {
                      title: "難しい算額",
                      description: "",
                      source: "",
                      difficulty: "difficult",
                      inputs: [],
                    },
                    relationships: {
                      user: { data: { id: "1", type: "user" } },
                      shrine: { data: { id: "1", type: "shrine" } },
                    },
                  },
                  {
                    id: "3",
                    type: "sangaku",
                    attributes: {
                      title: "とても難しい算額",
                      description: "",
                      source: "",
                      difficulty: "very_difficult",
                      inputs: [],
                    },
                    relationships: {
                      user: { data: { id: "1", type: "user" } },
                      shrine: { data: { id: "1", type: "shrine" } },
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
          }
          return new HttpResponse(JSON.stringify(beforeDedicateSangakus), {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "current-page": "1",
              "page-items": "20",
              "total-pages": "2",
              "total-count": "22",
            },
          });
        }),
      );
      await setSession(page);
      await page.goto("/user/sangakus");
      const tab = page.getByRole("tab", { name: "奉納した算額" });
      await tab.click();
      const main = page.locator("main");
      await expect(main.getByText("難しい", { exact: true }).first()).toBeVisible({
        timeout: 10_000,
      });
      await expect(main.getByText("とても難しい", { exact: true }).first()).toBeVisible({
        timeout: 10_000,
      });
    });

    test("should not allow me to see dedicated sangakus when fetch fails", async ({
      page,
      msw,
    }) => {
      msw.use(
        http.get(`${apiUrl}/api/v1/user/sangakus`, ({ request }) => {
          const url = new URL(request.url);
          const shrineId = url.searchParams.get("shrine_id");
          if (shrineId !== "") {
            return HttpResponse.json({}, { status: 500 });
          }
          return new HttpResponse(JSON.stringify(beforeDedicateSangakus), {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "current-page": "1",
              "page-items": "20",
              "total-pages": "2",
              "total-count": "22",
            },
          });
        }),
      );
      await setSession(page);
      await page.goto("/user/sangakus");
      const tab = page.getByRole("tab", { name: "奉納した算額" });
      await tab.click();
      await expect(
        page.getByText("リクエストに失敗しました"),
      ).toBeVisible({ timeout: 10_000 });
    });
  });
});
