import { setSession } from "../../../__helpers__/signin";
import { waitForHydration } from "../../../__helpers__/hydration";
import {
  pagedSangakusHandler,
  sangakuOf,
} from "../../../__helpers__/sangaku-list";

import {
  test,
  expect,
  http,
  HttpResponse,
  passthrough,
} from "@/tests/e2e/fixtures.msw";

const apiUrl = process.env.API_URL;

test.describe("/shrines/[id]/dedicate", () => {
  test.use({
    geolocation: { latitude: 35.70204829610801, longitude: 139.76789333814216 },
    permissions: ["geolocation"],
  });

  test.use({
    mswHandlers: [
      [
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
        http.get(`${apiUrl}/api/v1/user/sangakus`, () => {
          return HttpResponse.json(
            {
              data: [
                {
                  id: "1",
                  type: "sangaku",
                  attributes: {
                    title: "before_dedicate",
                    description: "test_description",
                    source: "puts 'Hello world'",
                    difficulty: "easy",
                    inputs: [
                      {
                        id: "1",
                        content: "test_input_1",
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
            },
            { status: 200 },
          );
        }),
        http.post(`${apiUrl}/api/v1/user/sangakus/1/dedicate`, () => {
          return HttpResponse.json({
            data: {
              id: "1",
              type: "sangaku",
              attributes: {
                title: "before_dedicate",
                description: "test_description",
                source: "puts 'Hello world'",
                difficulty: "easy",
                inputs: [
                  {
                    id: "1",
                    content: "test_input_1",
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
          });
        }),
        http.get(`${apiUrl}/api/v1/shrines/999`, () => {
          return new HttpResponse({}, { status: 404 });
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
    test("should not allow me to access dedicate page without authentication", async ({
      page,
    }) => {
      await page.goto("/shrines/1/dedicate");
      await expect(page).toHaveURL("/signin");
      const flash = page.getByTestId("flash-message");
      await expect(flash).toBeVisible({ timeout: 10_000 });
      await expect(flash).toContainText("サインインしてください");
      await expect(
        page.locator("main").getByRole("heading", { name: "サインイン" }),
      ).toBeVisible();
    });

    test("should allow me to see sign in button in nav after page reload", async ({
      page,
    }) => {
      await page.goto("/shrines/1/dedicate");
      await expect(page).toHaveURL("/signin");
      await page.reload();
      await expect(
        page.locator("nav").getByRole("button", { name: "サインイン" }),
      ).toBeVisible();
    });
  });

  test.describe("after signin", () => {
    test("should allow me to see an error message when fetching my sangakus fails", async ({
      page,
      msw,
    }) => {
      msw.use(
        http.get(`${apiUrl}/api/v1/user/sangakus`, () => {
          return HttpResponse.json({}, { status: 500 });
        }),
      );
      await setSession(page);

      await page.goto("/shrines/1/dedicate");

      await expect(
        page.getByRole("main").getByText("リクエストに失敗しました"),
      ).toBeVisible();
      // 一覧の取得が失敗しても、ページ全体はエラー画面に切り替わらない
      await expect(
        page.getByRole("heading", { name: "test_shrineに算額を奉納する" }),
      ).toBeVisible();
    });

    test("should allow me to see skeleton items while my sangakus are loading", async ({
      page,
      msw,
    }) => {
      let releaseSangakus!: () => void;
      const sangakusReleased = new Promise<void>((resolve) => {
        releaseSangakus = resolve;
      });
      msw.use(
        http.get(`${apiUrl}/api/v1/user/sangakus`, async () => {
          await sangakusReleased;
          return HttpResponse.json(
            { data: [sangakuOf("loaded_sangaku")] },
            { status: 200 },
          );
        }),
      );
      await setSession(page);

      try {
        // load を待つとストリーミングが終わって取得後の画面になるため、commit で戻る
        await page.goto("/shrines/1/dedicate", { waitUntil: "commit" });

        await expect(page.getByTestId("skeleton-item").first()).toBeVisible();
        // 一覧の取得を待たずに、ページの見出しが先に表示される
        await expect(
          page.getByRole("heading", { name: "test_shrineに算額を奉納する" }),
        ).toBeVisible();
      } finally {
        releaseSangakus();
      }

      await expect(
        page.getByRole("heading", { name: "loaded_sangaku" }),
      ).toBeVisible();
      await expect(page.getByTestId("skeleton-item")).toHaveCount(0);
    });

    test("should allow me to see the sangakus of the next page when clicking the pagination", async ({
      page,
      msw,
    }) => {
      msw.use(pagedSangakusHandler(apiUrl));
      await setSession(page);

      await page.goto("/shrines/1/dedicate");
      await expect(
        page.getByRole("heading", { name: "first_page" }),
      ).toBeVisible();

      const nextPageButton = page.getByRole("button", { name: "2ページ目へ移動" });
      await waitForHydration(nextPageButton);
      await nextPageButton.click();

      await expect(
        page.getByRole("heading", { name: "second_page" }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "first_page" }),
      ).toHaveCount(0);
      await expect(page).toHaveURL(/[?&]page=2/);
    });

    test("should not allow me to see the confirm modal left open after going back to the previous page", async ({
      page,
      msw,
    }) => {
      msw.use(pagedSangakusHandler(apiUrl));
      await setSession(page);
      await page.goto("/shrines/1/dedicate");
      const nextPageButton = page.getByRole("button", { name: "2ページ目へ移動" });
      await waitForHydration(nextPageButton);
      await nextPageButton.click();
      const secondPageSangaku = page.getByRole("heading", {
        name: "second_page",
      });
      await waitForHydration(secondPageSangaku);
      await secondPageSangaku.click();
      await expect(page.getByRole("dialog")).toBeVisible();

      await page.goBack();

      await expect(
        page.getByRole("heading", { name: "first_page" }),
      ).toBeVisible();
      await expect(page.getByRole("dialog")).toHaveCount(0);
    });

    test("should allow me to see the dedicated sangaku removed from the list after dedicating", async ({
      page,
      msw,
    }) => {
      let dedicated = false;
      msw.use(
        http.get(`${apiUrl}/api/v1/user/sangakus`, () => {
          return HttpResponse.json(
            {
              data: dedicated
                ? []
                : [sangakuOf("before_dedicate", { id: "1" })],
            },
            { status: 200 },
          );
        }),
        http.post(`${apiUrl}/api/v1/user/sangakus/1/dedicate`, () => {
          dedicated = true;
          return HttpResponse.json({
            data: sangakuOf("before_dedicate", { id: "1" }),
          });
        }),
      );
      await setSession(page);
      await page.goto("/shrines/1/dedicate");
      const sangaku = page.getByRole("heading", { name: "before_dedicate" });
      await waitForHydration(sangaku);
      await sangaku.click();
      const modal = page.getByRole("dialog");
      await modal.getByRole("button", { name: "この算額を奉納する" }).click();
      await expect(page.getByRole("link", { name: "でシェア" })).toBeVisible({
        timeout: 10_000,
      });

      await page.keyboard.press("Escape");

      await expect(page.getByRole("dialog")).toHaveCount(0);
      // 再取得中のスケルトンの間だけ見出しが 0 件になる状態と区別する
      await expect(page.getByTestId("skeleton-item")).toHaveCount(0);
      await expect(
        page.getByRole("heading", { name: "before_dedicate" }),
      ).toHaveCount(0);
    });

    test("should not allow my sangakus page to be stored in shared caches", async ({
      page,
    }) => {
      await setSession(page);

      const response = await page.goto("/shrines/1/dedicate");

      expect(response).not.toBeNull();
      expect(response!.headers()["cache-control"]).toContain("no-store");
    });

    test("should allow me to retry fetching the code blocks of a reorder sangaku after the first request fails", async ({
      page,
      msw,
    }) => {
      const reorderSangaku = {
        id: "5",
        type: "sangaku",
        attributes: {
          title: "reorder_before_dedicate",
          description: "reorder_description",
          difficulty: "easy",
          kind: "reorder",
          source: null,
          inputs: [],
          code_blocks: [
            { id: 1, content: "puts 1", correct_position: 1 },
            { id: 2, content: "puts 2", correct_position: 2 },
          ],
        },
        relationships: {
          user: { data: { id: "1", type: "user" } },
          shrine: { data: null },
        },
      };
      let detailRequests = 0;
      msw.use(
        http.get(`${apiUrl}/api/v1/user/sangakus`, () => {
          return HttpResponse.json({ data: [reorderSangaku] }, { status: 200 });
        }),
        http.get(`${apiUrl}/api/v1/user/sangakus/5`, () => {
          detailRequests += 1;
          if (detailRequests === 1) {
            return HttpResponse.json({}, { status: 500 });
          }
          return HttpResponse.json({ data: reorderSangaku }, { status: 200 });
        }),
      );
      await setSession(page);
      await page.goto("/shrines/1/dedicate");
      const reorderCard = page.getByRole("heading", {
        name: "reorder_before_dedicate",
      });
      await waitForHydration(reorderCard);
      await reorderCard.click();
      const modal = page.getByRole("dialog");
      await expect(
        modal.getByText("コードブロックの取得に失敗しました"),
      ).toBeVisible();

      await modal.getByRole("button", { name: "再試行" }).click();

      await expect(modal.getByTestId("confirm-modal-code-block-1")).toContainText(
        "puts 1",
      );
      await expect(
        modal.getByText("コードブロックの取得に失敗しました"),
      ).not.toBeVisible();
    });

    test("should allow me to see a sign-in message without a retry button when the session has expired while fetching the code blocks of a reorder sangaku", async ({
      page,
      msw,
    }) => {
      const reorderSangaku = {
        ...sangakuOf("reorder_before_dedicate", { id: "5" }),
        attributes: {
          ...sangakuOf("reorder_before_dedicate", { id: "5" }).attributes,
          kind: "reorder",
          source: null,
        },
      };
      msw.use(
        http.get(`${apiUrl}/api/v1/user/sangakus`, () => {
          return HttpResponse.json({ data: [reorderSangaku] }, { status: 200 });
        }),
        http.get(`${apiUrl}/api/v1/user/sangakus/5`, () => {
          return HttpResponse.json({}, { status: 401 });
        }),
      );
      await setSession(page);
      await page.goto("/shrines/1/dedicate");
      const reorderCard = page.getByRole("heading", {
        name: "reorder_before_dedicate",
      });
      await waitForHydration(reorderCard);
      await reorderCard.click();

      const modal = page.getByRole("dialog");
      await expect(modal.getByRole("alert")).toContainText(
        "セッションの有効期限が切れています",
      );
      await expect(modal.getByRole("button", { name: "再試行" })).toHaveCount(0);
    });

    test("should allow me to dedicate own sangaku to shrine", async ({
      page,
    }) => {
      await setSession(page);

      await page.goto("/shrines/1/dedicate");
      const sangaku = page.getByRole("heading", { name: "before_dedicate" });
      await waitForHydration(sangaku);
      await sangaku.click();
      const modal = page.getByRole("dialog");
      const heading = modal.getByRole("heading", { name: "before_dedicate" });
      await expect(heading).toBeVisible();
      const button = modal.getByRole("button", { name: "この算額を奉納する" });
      await button.click();
      await expect(page).toHaveURL("/shrines/1/dedicate");
      const flash = page.getByTestId("flash-message");
      await expect(flash).toBeVisible({ timeout: 10_000 });
      await expect(flash).toContainText("算額を奉納しました");
      const shareButton = page.getByRole("link", { name: "でシェア" });
      await expect(shareButton).toBeVisible();
    });

    test("should allow me to see a correctly formatted share link after dedicating sangaku to shrine", async ({
      page,
    }) => {
      // Arrange: 算額を奉納してシェアボタンを表示させる
      await setSession(page);

      await page.goto("/shrines/1/dedicate");
      const sangaku = page.getByRole("heading", { name: "before_dedicate" });
      await waitForHydration(sangaku);
      await sangaku.click();
      const modal = page.getByRole("dialog");
      const heading = modal.getByRole("heading", { name: "before_dedicate" });
      await expect(heading).toBeVisible();
      const button = modal.getByRole("button", { name: "この算額を奉納する" });
      await button.click();
      await expect(page).toHaveURL("/shrines/1/dedicate");
      const flash = page.getByTestId("flash-message");
      await expect(flash).toBeVisible({ timeout: 10_000 });
      const shareButton = page.getByRole("link", { name: "でシェア" });
      await expect(shareButton).toBeVisible();

      // Act: シェアボタンの href から X Intent の url クエリパラメータを取り出す
      const href = await shareButton.getAttribute("href");
      if (href === null) {
        throw new Error("shareButton href is null");
      }
      const intentUrl = new URL(href);
      const sharedUrlParam = intentUrl.searchParams.get("url");
      if (sharedUrlParam === null) {
        throw new Error("url query parameter is missing");
      }
      const sharedUrl = new URL(sharedUrlParam);

      // Assert: パスが "/shrines"（先頭にスラッシュ）であり、緯度経度が一致すること
      expect(sharedUrl.pathname).toBe("/shrines");
      expect(sharedUrl.searchParams.get("lat")).toBe("35.70204829610801");
      expect(sharedUrl.searchParams.get("lng")).toBe("139.76789333814216");
    });

    test("should allow me to see not found page for a non-existent shrine", async ({
      page,
    }) => {
      await setSession(page);

      await page.goto("/shrines/999/dedicate");
      const message = page.getByRole("heading", {
        name: "404",
      });
      await expect(message).toBeVisible();
    });
  });
});
