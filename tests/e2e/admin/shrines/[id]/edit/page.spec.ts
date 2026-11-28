import { setSession, setAdminSession } from "@/tests/__helpers__/signin";
import {
  test,
  expect,
  http,
  HttpResponse,
  passthrough,
} from "@/tests/e2e/fixtures.msw";

const apiUrl = process.env.API_URL;

const shrineResponse = {
  data: {
    id: "1",
    type: "shrine",
    attributes: {
      name: "管理神社テスト",
      address: "東京都千代田区1-1",
      latitude: 35.681236,
      longitude: 139.767125,
      sangaku_count: 2,
    },
  },
};

const updateResponse = {
  data: {
    id: "1",
    type: "shrine",
    attributes: {
      name: "更新後の神社名",
      address: "東京都千代田区1-1",
      latitude: 35.681236,
      longitude: 139.767125,
      sangaku_count: 2,
    },
  },
};

// /admin/shrines/[id]/edit
test.describe("/admin/shrines/[id]/edit", () => {
  test.use({
    mswHandlers: [
      [
        http.get(`${apiUrl}/api/v1/admin/shrines/1`, () => {
          return HttpResponse.json(shrineResponse, { status: 200 });
        }),
        http.patch(`${apiUrl}/api/v1/admin/shrines/1`, () => {
          return HttpResponse.json(updateResponse, { status: 200 });
        }),
        http.all("*", () => {
          return passthrough();
        }),
      ],
      { scope: "test" },
    ],
  });

  // 未認証ユーザー
  test.describe("unauthenticated user", () => {
    // 認証なしでは神社編集ページにアクセスできない
    test("should not allow me to access shrine edit page without authentication", async ({
      page,
    }) => {
      await page.goto("/admin/shrines/1/edit");
      await expect(page).toHaveURL("/signin");
      const mainNode = page.locator("main");
      await expect(mainNode.getByRole("heading", { name: "サインイン" })).toBeVisible();
    });
  });

  // 一般ユーザー
  test.describe("general user", () => {
    // 一般ユーザーでは神社編集ページにアクセスできない
    test("should not allow me to access shrine edit page as a general user", async ({
      page,
    }) => {
      await setSession(page);
      await page.goto("/admin/shrines/1/edit");
      await expect(page).toHaveURL("/");
      await expect(page.getByRole("heading", { name: "アルゴ算額" })).toBeVisible();
    });
  });

  // 管理者でサインインした後
  test.describe("after admin signin", () => {
    // 管理者として、神社詳細の見出しが見える
    test("should allow me to see the shrine detail heading as admin", async ({ page }) => {
      await setAdminSession(page);
      await page.goto("/admin/shrines/1/edit");
      await expect(
        page.getByRole("heading", { name: "神社詳細・編集" }),
      ).toBeVisible();
    });

    // 既存の神社名が入力済みのフォームが見える
    test("should allow me to see the form pre-filled with the existing shrine name", async ({ page }) => {
      await setAdminSession(page);
      await page.goto("/admin/shrines/1/edit");
      await expect(page.getByLabel("神社名")).toHaveValue("管理神社テスト");
    });

    // 神社名を更新できる
    test("should allow me to update shrine name", async ({ page }) => {
      await setAdminSession(page);
      await page.goto("/admin/shrines/1/edit");
      await page.getByLabel("神社名").fill("更新後の神社名");
      await page.getByRole("button", { name: "更新" }).click();
      const flash = page.getByTestId('flash-message');
      await expect(flash).toBeVisible({ timeout: 10_000 });
      await expect(flash).toContainText("神社を更新しました");
    });
  });
});

// /admin/shrines/[id]/edit（存在しないとき）
test.describe("/admin/shrines/[id]/edit (not found)", () => {
  test.use({
    mswHandlers: [
      [
        http.get(`${apiUrl}/api/v1/admin/shrines/1`, () => {
          return HttpResponse.json({}, { status: 404 });
        }),
        http.all("*", () => passthrough()),
      ],
      { scope: "test" },
    ],
  });

  // 神社が見つからないとき、神社編集ページが見えない
  test("should not allow me to see shrine edit page when shrine is not found", async ({ page }) => {
    await setAdminSession(page);
    await page.goto("/admin/shrines/1/edit");
    await expect(
      page.getByRole("heading", { name: "404" }),
    ).toBeVisible({ timeout: 10_000 });
  });
});
