import { setSession } from "../../../__helpers__/signin";
import {
  test,
  expect,
  http,
  HttpResponse,
  passthrough,
} from "@/tests/e2e/fixtures.msw";

const apiUrl = process.env.API_URL;

const representativeSangakuBody = {
  data: {
    id: "5",
    type: "sangaku",
    attributes: {
      title: "representative_title",
      description: "d",
      difficulty: "normal",
      kind: "reorder",
      inputs: [],
      author_name: "a",
      shrine_name: "test_shrine",
      code_blocks: [{ id: 1, content: "puts 1" }],
    },
    relationships: {
      user: { data: { id: "2", type: "user" } },
      shrine: { data: { id: "1", type: "shrine" } },
    },
  },
};

test.describe("/shrines/[id]/sangakus", () => {
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
        http.get(`${apiUrl}/api/v1/shrines/999`, () => {
          return new HttpResponse({}, { status: 404 });
        }),
        http.get(`${apiUrl}/api/v1/shrines/1/sangakus`, () => {
          return HttpResponse.json({
            data: [
              {
                id: "1",
                type: "sangaku",
                attributes: {
                  title: "test_title",
                  description: "test_description",
                  source: "put 'Hello world'",
                  difficulty: "normal",
                  inputs: [],
                },
                relationships: {
                  user: {
                    data: {
                      id: "2",
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
          });
        }),
        http.get(`${apiUrl}/api/v1/user/saved_sangaku_ids`, () => {
          return HttpResponse.json({ saved_sangaku_ids: [] }, { status: 200 });
        }),
        http.post(`${apiUrl}/api/v1/sangakus/1/save`, () => {
          return HttpResponse.json(
            {
              data: [
                {
                  id: "1",
                  type: "sangaku",
                  attributes: {
                    title: "test_title",
                    description: "test_description",
                    source: "put 'Hello world'",
                    difficulty: "normal",
                    inputs: [],
                  },
                  relationships: {
                    user: {
                      data: {
                        id: "2",
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
    test("should allow me to see shrine sangaku list without signing in", async ({ page }) => {
      await page.goto("/shrines/1/sangakus");
      const heading = page.getByRole("heading", {
        name: "test_shrineの算額一覧",
      });
      await expect(heading).toBeVisible();
      const sangakuTitle = page.getByRole("heading", {
        name: "test_title",
      });
      await expect(sangakuTitle).toBeVisible();
    });

    // TODO: 未ログイン時の「算額を写す」ボタンクリック後のリダイレクト動作が未実装のためコメントアウト
    // test("should not allow me to create sangakuCopy", async ({ page }) => {
    //   await page.goto("/shrines/1/sangakus");
    //   const heading = page.getByRole("heading", {
    //     name: "test_shrineの算額一覧",
    //   });
    //   await expect(heading).toBeVisible();
    //   const button = page.getByRole("button", { name: "算額を写す" });
    //   await button.click();
    //   const flash = page.getByTestId('flash-message');
    //   await expect(flash).toBeVisible({ timeout: 10_000 });
    //   await expect(flash).toContainText("サインインしてください");
    // });

    test("should allow me to see not found page for a non-existent shrine", async ({ page }) => {
      await page.goto("/shrines/999/sangakus");
      const message = page.getByRole("heading", {
        name: "This page could not be found.",
      });
      await expect(message).toBeVisible();
    });

    test("should allow me to filter shrine sangaku list by kind when the kind query param is present", async ({
      page,
      msw,
    }) => {
      // Arrange
      let capturedKind: string | null = "not_called";
      msw.use(
        http.get(`${apiUrl}/api/v1/shrines/1/sangakus`, ({ request }) => {
          capturedKind = new URL(request.url).searchParams.get("kind");
          return HttpResponse.json(
            { data: [] },
            { status: 200, headers: { "total-pages": "0" } },
          );
        }),
      );

      // Act
      await page.goto("/shrines/1/sangakus?kind=reorder");

      // Assert
      const heading = page.getByRole("heading", {
        name: "test_shrineの算額一覧",
      });
      await expect(heading).toBeVisible();
      expect(capturedKind).toBe("reorder");
    });

    test("should allow me to see the representative sangaku card at the head of the list with a guest answer button when I am a guest", async ({
      page,
      msw,
    }) => {
      // Arrange
      msw.use(
        http.get(
          `${apiUrl}/api/v1/public/shrines/1/representative_reorder_sangaku`,
          () => HttpResponse.json(representativeSangakuBody, { status: 200 }),
        ),
      );

      // Act
      await page.goto("/shrines/1/sangakus");

      // Assert
      const titles = page.getByRole("heading", { level: 5 });
      await expect(titles.first()).toHaveText("representative_title");
      await expect(titles.nth(1)).toHaveText("test_title");
      const guestButton = page.getByRole("link", { name: "お試しで解く" });
      await expect(guestButton).toHaveCount(1);
      await expect(guestButton).toHaveAttribute("href", "/play/reorder/5");
    });

    test("should not allow me to see the copy button on the representative sangaku card when I am a guest", async ({
      page,
      msw,
    }) => {
      // Arrange
      msw.use(
        http.get(
          `${apiUrl}/api/v1/public/shrines/1/representative_reorder_sangaku`,
          () => HttpResponse.json(representativeSangakuBody, { status: 200 }),
        ),
      );

      // Act
      await page.goto("/shrines/1/sangakus");

      // Assert
      // 通常の一覧の1件だけが「算額を写す」を持ち、先頭カードは持たない
      await expect(page.getByRole("heading", { level: 5 }).first()).toHaveText(
        "representative_title",
      );
      await expect(page.getByRole("button", { name: "算額を写す" })).toHaveCount(1);
    });

    test("should allow me to go to the guest answer page when clicking the guest answer button", async ({
      page,
      msw,
    }) => {
      // Arrange
      msw.use(
        http.get(
          `${apiUrl}/api/v1/public/shrines/1/representative_reorder_sangaku`,
          () => HttpResponse.json(representativeSangakuBody, { status: 200 }),
        ),
        http.get(`${apiUrl}/api/v1/public/reorder_sangakus/5`, () =>
          HttpResponse.json(representativeSangakuBody, { status: 200 }),
        ),
      );
      await page.goto("/shrines/1/sangakus");

      // Act
      await page.getByRole("link", { name: "お試しで解く" }).click();

      // Assert
      await expect(page).toHaveURL(/\/play\/reorder\/5$/);
    });

    test("should not allow me to see the representative sangaku card when the shrine has no representative sangaku", async ({
      page,
      msw,
    }) => {
      // Arrange
      msw.use(
        http.get(
          `${apiUrl}/api/v1/public/shrines/1/representative_reorder_sangaku`,
          () => new HttpResponse(null, { status: 404 }),
        ),
      );

      // Act
      await page.goto("/shrines/1/sangakus");

      // Assert
      // 回帰ガード: 代表問題が無い神社で先頭カードが誤って表示される実装を防ぐ
      await expect(page.getByRole("heading", { level: 5 }).first()).toHaveText(
        "test_title",
      );
      await expect(page.getByRole("link", { name: "お試しで解く" })).toHaveCount(0);
    });

    for (const [label, query] of [
      ["the second page", "?page=2"],
      ["a search query", "?query=abc"],
      ["a difficulty filter", "?difficulty=normal"],
      ["a kind filter", "?kind=reorder"],
    ] as const) {
      test(`should not allow me to see the representative sangaku card when ${label} is specified`, async ({
        page,
        msw,
      }) => {
        // Arrange
        msw.use(
          http.get(
            `${apiUrl}/api/v1/public/shrines/1/representative_reorder_sangaku`,
            () => HttpResponse.json(representativeSangakuBody, { status: 200 }),
          ),
        );

        // Act
        await page.goto(`/shrines/1/sangakus${query}`);

        // Assert
        // 回帰ガード: 2ページ目・絞り込み時に先頭カードが混ざる実装を防ぐ
        await expect(
          page.getByRole("heading", { name: "test_shrineの算額一覧" }),
        ).toBeVisible();
        await expect(page.getByRole("link", { name: "お試しで解く" })).toHaveCount(0);
      });
    }
  });

  test.describe("after signin", () => {
    test("should not allow me to see the representative sangaku card when I am signed in", async ({
      page,
      msw,
    }) => {
      // Arrange
      msw.use(
        http.get(
          `${apiUrl}/api/v1/public/shrines/1/representative_reorder_sangaku`,
          () => HttpResponse.json(representativeSangakuBody, { status: 200 }),
        ),
      );
      await setSession(page);

      // Act
      await page.goto("/shrines/1/sangakus");

      // Assert
      // 回帰ガード: ログイン済みユーザーに先頭カードが誤って表示される実装を防ぐ
      await expect(page.getByRole("heading", { level: 5 }).first()).toHaveText(
        "test_title",
      );
      await expect(page.getByRole("link", { name: "お試しで解く" })).toHaveCount(0);
    });

    test("should allow me to copy a sangaku from the shrine page", async ({ page }) => {
      await setSession(page);

      await page.goto("/shrines/1/sangakus");
      const heading = page.getByRole("heading", {
        name: "test_shrineの算額一覧",
      });
      await expect(heading).toBeVisible();
      const sangakuTitle = page.getByRole("heading", {
        name: "test_title",
      });
      await expect(sangakuTitle).toBeVisible();
      const button = page.getByRole("button", { name: "算額を写す" });
      await button.click();
      const flash = page.getByTestId('flash-message');
      await expect(flash).toBeVisible({ timeout: 10_000 });
      await expect(flash).toContainText("算額の写しを作成しました");
      const savedButton = page.getByRole("button", { name: "保存済み" });
      await expect(savedButton).toBeVisible();
      await expect(savedButton).toBeDisabled();
    });

    test("should show an already-saved sangaku as disabled with a 保存済み label on initial load", async ({
      page,
      msw,
    }) => {
      msw.use(
        http.get(`${apiUrl}/api/v1/user/saved_sangaku_ids`, () => {
          return HttpResponse.json({ saved_sangaku_ids: [1] }, { status: 200 });
        }),
      );
      await setSession(page);

      await page.goto("/shrines/1/sangakus");
      const heading = page.getByRole("heading", {
        name: "test_shrineの算額一覧",
      });
      await expect(heading).toBeVisible();
      const savedButton = page.getByRole("button", { name: "保存済み" });
      await expect(savedButton).toBeVisible();
      await expect(savedButton).toBeDisabled();
    });

    test("should not allow me to save an already-saved sangaku", async ({
      page,
      msw,
    }) => {
      msw.use(
        http.post(`${apiUrl}/api/v1/sangakus/1/save`, () => {
          return HttpResponse.json({ message: "Conflict" }, { status: 409 });
        }),
      );
      await setSession(page);

      await page.goto("/shrines/1/sangakus");
      const heading = page.getByRole("heading", {
        name: "test_shrineの算額一覧",
      });
      await expect(heading).toBeVisible();
      const button = page.getByRole("button", { name: "算額を写す" });
      await button.click();
      const flash = page.getByTestId('flash-message');
      await expect(flash).toBeVisible({ timeout: 10_000 });
      await expect(flash).toContainText("この算額はすでに保存済みです");
      const savedButton = page.getByRole("button", { name: "保存済み" });
      await expect(savedButton).toBeVisible();
      await expect(savedButton).toBeDisabled();
    });

    test("should not show a generic error message alongside the session-expired message when saving fails with 401", async ({
      page,
      msw,
    }) => {
      msw.use(
        http.post(`${apiUrl}/api/v1/sangakus/1/save`, () => {
          return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
        }),
        http.delete(`${apiUrl}/api/v1/authenticate`, () => {
          return HttpResponse.error();
        }),
      );
      await setSession(page);

      await page.goto("/shrines/1/sangakus");
      const heading = page.getByRole("heading", {
        name: "test_shrineの算額一覧",
      });
      await expect(heading).toBeVisible();
      const button = page.getByRole("button", { name: "算額を写す" });
      await button.click();
      const flash = page.getByTestId('flash-message');
      await expect(flash).toBeVisible({ timeout: 10_000 });
      await expect(flash).toContainText(
        "セッションの有効期限が切れています",
      );
      await expect(flash).not.toContainText("リクエストに失敗しました");
      await expect(
        page.getByRole("button", { name: "算額を写す" }),
      ).toBeVisible();
    });
  });
});
