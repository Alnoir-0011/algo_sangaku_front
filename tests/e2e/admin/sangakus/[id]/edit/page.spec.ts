import { setSession, setAdminSession } from "@/tests/__helpers__/signin";
import {
  test,
  expect,
  http,
  HttpResponse,
  passthrough,
} from "@/tests/e2e/fixtures.msw";

const apiUrl = process.env.API_URL;

const sangakuResponse = {
  data: {
    id: "1",
    type: "sangaku",
    attributes: {
      title: "管理算額テスト",
      difficulty: "easy",
      created_at: "2026-01-01T00:00:00.000+09:00",
      user_name: "test_user",
      shrine_name: "test_shrine",
      description: "テスト説明文",
      source: "print('hello')",
    },
  },
};

const updateResponse = {
  data: {
    id: "1",
    type: "sangaku",
    attributes: {
      title: "更新後の算額タイトル",
      difficulty: "normal",
      created_at: "2026-01-01T00:00:00.000+09:00",
      user_name: "test_user",
      shrine_name: "test_shrine",
      description: "更新後の説明文",
      source: "print('updated')",
    },
  },
};

test.describe("/admin/sangakus/[id]/edit", () => {
  test.use({
    mswHandlers: [
      [
        http.get(`${apiUrl}/api/v1/admin/sangakus/1`, () => {
          return HttpResponse.json(sangakuResponse, { status: 200 });
        }),
        http.patch(`${apiUrl}/api/v1/admin/sangakus/1`, () => {
          return HttpResponse.json(updateResponse, { status: 200 });
        }),
        http.all("*", () => {
          return passthrough();
        }),
      ],
      { scope: "test" },
    ],
  });

  test.describe("unauthenticated user", () => {
    test("should not allow me to access sangaku edit page without authentication", async ({
      page,
    }) => {
      await page.goto("/admin/sangakus/1/edit");
      await expect(page).toHaveURL("/signin");
      const mainNode = page.locator("main");
      await expect(mainNode.getByRole("heading", { name: "サインイン" })).toBeVisible();
    });
  });

  test.describe("general user", () => {
    test("should not allow me to access sangaku edit page as a general user", async ({
      page,
    }) => {
      await setSession(page);
      await page.goto("/admin/sangakus/1/edit");
      await expect(page).toHaveURL("/");
      await expect(page.getByRole("heading", { name: "アルゴ算額" })).toBeVisible();
    });
  });

  test.describe("after admin signin", () => {
    test("should allow me to see the sangaku edit heading as admin", async ({ page }) => {
      await setAdminSession(page);
      await page.goto("/admin/sangakus/1/edit");
      await expect(
        page.getByRole("heading", { name: "算額詳細・編集" }),
      ).toBeVisible();
    });

    test("should allow me to see the form pre-filled with the existing sangaku title", async ({
      page,
    }) => {
      await setAdminSession(page);
      await page.goto("/admin/sangakus/1/edit");
      await expect(page.getByLabel("タイトル")).toHaveValue("管理算額テスト", { timeout: 10_000 });
    });

    test("should allow me to update sangaku title", async ({ page }) => {
      await setAdminSession(page);
      await page.goto("/admin/sangakus/1/edit");
      await page.getByLabel("タイトル").fill("更新後の算額タイトル");
      await page.getByRole("button", { name: "更新" }).click();
      const flash = page.getByTestId('flash-message');
      await expect(flash).toBeVisible({ timeout: 10_000 });
      await expect(flash).toContainText("算額を更新しました");
    });
  });
});

test.describe("/admin/sangakus/[id]/edit (kind: reorder)", () => {
  test.use({
    mswHandlers: [
      [
        http.get(`${apiUrl}/api/v1/admin/sangakus/2`, () => {
          return HttpResponse.json(
            {
              data: {
                id: "2",
                type: "sangaku",
                attributes: {
                  title: "並べ替え管理算額テスト",
                  difficulty: "easy",
                  created_at: "2026-01-01T00:00:00.000+09:00",
                  user_name: "test_user",
                  shrine_name: "test_shrine",
                  description: "テスト説明文",
                  source: null,
                  kind: "reorder",
                  code_blocks: [
                    { id: 1, content: "puts 1", correct_position: 1 },
                    { id: 2, content: "puts 2", correct_position: 2 },
                  ],
                },
              },
            },
            { status: 200 },
          );
        }),
        http.patch(`${apiUrl}/api/v1/admin/sangakus/2`, () => {
          return HttpResponse.json(
            {
              data: {
                id: "2",
                type: "sangaku",
                attributes: {
                  title: "並べ替え管理算額テスト",
                  difficulty: "easy",
                  created_at: "2026-01-01T00:00:00.000+09:00",
                  user_name: "test_user",
                  shrine_name: "test_shrine",
                  description: "テスト説明文",
                  source: null,
                  kind: "reorder",
                  code_blocks: [
                    { id: 1, content: "puts 100", correct_position: 1 },
                    { id: 2, content: "puts 2", correct_position: 2 },
                  ],
                },
              },
            },
            { status: 200 },
          );
        }),
        http.all("*", () => passthrough()),
      ],
      { scope: "test" },
    ],
  });

  test("should allow me to see CodeBlockEditor instead of the source field when kind is reorder", async ({
    page,
  }) => {
    await setAdminSession(page);
    await page.goto("/admin/sangakus/2/edit");
    await expect(page.getByLabel("block-content-0")).toHaveValue("puts 1", {
      timeout: 10_000,
    });
    await expect(page.getByLabel("想定回答")).not.toBeVisible();
  });

  test("should allow me to update a reorder sangaku with edited code blocks", async ({
    page,
  }) => {
    await setAdminSession(page);
    await page.goto("/admin/sangakus/2/edit");
    await expect(page.getByLabel("block-content-0")).toHaveValue("puts 1", {
      timeout: 10_000,
    });

    // Act: ブロック内容を編集して更新する（isReorderKind の分岐・
    // toAdminCodeBlockInputs 経由での updateSangaku 呼び出しを通す）
    await page.getByLabel("block-content-0").fill("puts 100");
    await page.getByRole("button", { name: "更新" }).click();

    // Assert
    const flash = page.getByTestId("flash-message");
    await expect(flash).toBeVisible({ timeout: 10_000 });
    await expect(flash).toContainText("算額を更新しました");
  });

  test("should not allow me to click the update button when there are fewer than two correct blocks", async ({
    page,
  }) => {
    await setAdminSession(page);
    await page.goto("/admin/sangakus/2/edit");
    await expect(page.getByLabel("block-content-0")).toHaveValue("puts 1", {
      timeout: 10_000,
    });

    // Act: 1ブロックだけ残して正解ブロックを2個未満にする
    // （canSubmitReorderBlocks が false になる分岐）
    await page.getByRole("button", { name: "削除" }).first().click();
    await expect(
      page.getByLabel("minCodeBlocksWarning"),
    ).toBeVisible();

    // Assert
    await expect(page.getByRole("button", { name: "更新" })).toBeDisabled();
  });
});

test.describe("/admin/sangakus/[id]/edit (not found)", () => {
  test.use({
    mswHandlers: [
      [
        http.get(`${apiUrl}/api/v1/admin/sangakus/1`, () => {
          return HttpResponse.json({}, { status: 404 });
        }),
        http.all("*", () => passthrough()),
      ],
      { scope: "test" },
    ],
  });

  test("should not allow me to see sangaku edit page when sangaku is not found", async ({ page }) => {
    await setAdminSession(page);
    await page.goto("/admin/sangakus/1/edit");
    await expect(
      page.getByRole("heading", { name: "This page could not be found." }),
    ).toBeVisible({ timeout: 10_000 });
  });
});
