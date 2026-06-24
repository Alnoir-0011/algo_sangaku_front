import { setSession, setAdminSession } from "@/tests/__helpers__/signin";
import {
  test,
  expect,
  http,
  HttpResponse,
  passthrough,
} from "@/tests/e2e/fixtures.msw";

const apiUrl = process.env.API_URL;

const usersResponse = {
  data: [
    {
      id: "1",
      type: "user",
      attributes: {
        name: "Admin User",
        email: "admin@example.com",
        nickname: "admin",
        role: "admin",
        created_at: "2026-01-01T00:00:00.000+09:00",
        sangaku_count: 2,
        answer_count: 5,
      },
    },
    {
      id: "2",
      type: "user",
      attributes: {
        name: "General User",
        email: "general@example.com",
        nickname: "general",
        role: "general",
        created_at: "2026-01-02T00:00:00.000+09:00",
        sangaku_count: 3,
        answer_count: 10,
      },
    },
  ],
};

// 成功レスポンスハンドラを生成するファクトリ（sort パラメータのキャプチャに対応）
function makeUsersHandler(onRequest?: (sort: string | null) => void) {
  return http.get(`${apiUrl}/api/v1/admin/users`, ({ request }) => {
    if (onRequest) {
      const url = new URL(request.url);
      onRequest(url.searchParams.get("sort"));
    }
    return new HttpResponse(JSON.stringify(usersResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "current-page": "1",
        "page-items": "20",
        "total-pages": "1",
        "total-count": "2",
      },
    });
  });
}

test.describe("/admin/users", () => {
  test.use({
    mswHandlers: [
      [
        makeUsersHandler(),
        http.all("*", () => passthrough()),
      ],
      { scope: "test" },
    ],
  });

  test.describe("unauthenticated user", () => {
    test("should not allow me to access user list without authentication", async ({ page }) => {
      await page.goto("/admin/users");
      await expect(page).toHaveURL("/signin");
      const flash = page.getByTestId("flash-message");
      await expect(flash).toBeVisible({ timeout: 10_000 });
      await expect(flash).toContainText("サインインしてください");
      await expect(page.locator("main").getByRole("heading", { name: "サインイン" })).toBeVisible();
    });
  });

  test.describe("general user", () => {
    test("should not allow me to access user list as a general user", async ({ page }) => {
      await setSession(page);
      await page.goto("/admin/users");
      await expect(page).toHaveURL("/");
      await expect(page.getByRole("heading", { name: "アルゴ算額" })).toBeVisible();
    });
  });

  test.describe("after admin signin", () => {
    test.beforeEach(async ({ page }) => {
      await setAdminSession(page);
      await page.goto("/admin/users");
    });

    test("should allow me to see the users list heading as admin", async ({ page }) => {
      await expect(
        page.getByRole("heading", { name: "ユーザー管理" }),
      ).toBeVisible({ timeout: 10_000 });
    });

    test("should allow me to see user names from API", async ({ page }) => {
      await expect(page.getByText("Admin User")).toBeVisible();
      await expect(page.getByText("General User")).toBeVisible();
    });

    test("should allow me to see the edit link for each user", async ({ page }) => {
      const editLinks = page.getByRole("link", { name: "編集" });
      await expect(editLinks.first()).toBeVisible();
    });

    // RED: AdminUserRow に created_at カラムが存在しない（page.tsx のテーブルに登録日時列・AdminUserSortHeader が未実装）
    test("should allow me to see created_at formatted as YYYY/MM/DD in the user list", async ({ page }) => {
      await expect(page.getByText("2026/01/01")).toBeVisible({ timeout: 10_000 });
      await expect(page.getByText("2026/01/02")).toBeVisible();
    });

    // RED: AdminUserRow に created_at カラムが存在しない（AdminUserSortHeader が未実装）
    test("should allow me to see URL changed to ?sort=asc when clicking the created_at sort header with no current sort", async ({ page }) => {
      // Arrange: beforeEach で /admin/users に遷移済み（sort パラメータなし）
      // Act
      await page.getByRole("columnheader", { name: /登録日時/ }).getByRole("button").click();
      // Assert
      await expect(page).toHaveURL(/[?&]sort=asc/);
    });

    // RED: AdminUserRow に created_at カラムが存在しない（AdminUserSortHeader が未実装）
    test("should allow me to toggle sort to desc when clicking the created_at sort header with sort=asc", async ({ page }) => {
      // Arrange
      await page.goto("/admin/users?sort=asc");
      // Act
      await page.getByRole("columnheader", { name: /登録日時/ }).getByRole("button").click();
      // Assert
      await expect(page).toHaveURL(/[?&]sort=desc/);
    });
  });
});

test.describe("/admin/users (API error)", () => {
  test.use({
    mswHandlers: [
      [
        http.get(`${apiUrl}/api/v1/admin/users`, () => {
          return HttpResponse.json({}, { status: 500 });
        }),
        http.all("*", () => passthrough()),
      ],
      { scope: "test" },
    ],
  });

  test("should not allow me to see user list when API returns error", async ({ page }) => {
    await setAdminSession(page);
    await page.goto("/admin/users");
    await expect(page.getByRole("heading", { name: "ユーザー管理" })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("データを取得できませんでした")).toBeVisible();
    await expect(page.getByText("Admin User")).not.toBeVisible();
  });
});
