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
      await expect(page.getByLabel("タイトル")).toHaveValue("管理算額テスト");
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
