import { setSession, setAdminSession } from "@/tests/__helpers__/signin";
import {
  test,
  expect,
  http,
  HttpResponse,
  passthrough,
} from "@/tests/e2e/fixtures.msw";

const apiUrl = process.env.API_URL;

const sangakusResponse = {
  data: [
    {
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
    {
      id: "2",
      type: "sangaku",
      attributes: {
        title: "未奉納の算額",
        difficulty: "normal",
        created_at: "2026-01-02T00:00:00.000+09:00",
        user_name: "another_user",
        shrine_name: null,
        description: "",
        source: "",
      },
    },
  ],
};

test.describe("/admin/sangakus", () => {
  test.use({
    mswHandlers: [
      [
        http.get(`${apiUrl}/api/v1/admin/sangakus`, () => {
          return new HttpResponse(JSON.stringify(sangakusResponse), {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "current-page": "1",
              "page-items": "20",
              "total-pages": "1",
              "total-count": "2",
            },
          });
        }),
        http.all("*", () => {
          return passthrough();
        }),
      ],
      { scope: "test" },
    ],
  });

  test.describe("general user", () => {
    test("should not allow me to access /admin/sangakus as a general user", async ({
      page,
    }) => {
      await setSession(page);
      await page.goto("/admin/sangakus");
      await expect(page).toHaveURL("/");
      await expect(page.getByRole("heading", { name: "アルゴ算額" })).toBeVisible();
    });
  });

  test.describe("after admin signin", () => {
    test.beforeEach(async ({ page }) => {
      await setAdminSession(page);
      await page.goto("/admin/sangakus");
    });

    test("should allow me to see the sangakus list heading as admin", async ({ page }) => {
      await expect(
        page.getByRole("heading", { name: "算額管理" }),
      ).toBeVisible();
    });

    test("should allow me to see sangaku titles on the list page", async ({ page }) => {
      await expect(page.getByText("管理算額テスト")).toBeVisible();
      await expect(page.getByText("未奉納の算額")).toBeVisible();
    });

    test("should allow me to see shrine name when sangaku is dedicated", async ({ page }) => {
      await expect(page.getByText("test_shrine")).toBeVisible();
    });

    test("should allow me to see 未奉納 label when sangaku is not dedicated", async ({ page }) => {
      await expect(page.getByText("未奉納", { exact: true })).toBeVisible();
    });

    test("should allow me to see edit link for each sangaku", async ({ page }) => {
      await expect(page.getByRole("link", { name: "編集" }).first()).toBeVisible();
    });

    test("should allow me to delete sangaku when confirmed", async ({ page, msw }) => {
      msw.use(
        http.delete(`${apiUrl}/api/v1/admin/sangakus/1`, () => {
          return HttpResponse.json({}, { status: 200 });
        }),
      );
      page.once("dialog", async (dialog) => {
        await dialog.accept();
      });
      await page.getByRole("button", { name: "削除" }).first().click();
      const flash = page.getByTestId('flash-message');
      await expect(flash).toBeVisible({ timeout: 10_000 });
      await expect(flash).toContainText("算額を削除しました");
    });

    test("should not allow me to delete sangaku when cancelled", async ({
      page,
    }) => {
      page.once("dialog", async (dialog) => {
        await dialog.dismiss();
      });
      await page.getByRole("button", { name: "削除" }).first().click();
      await expect(page.getByText("管理算額テスト")).toBeVisible();
      await expect(page.getByText("算額を削除しました")).not.toBeVisible({ timeout: 3_000 });
    });
  });
});

test.describe("/admin/sangakus (API error)", () => {
  test.use({
    mswHandlers: [
      [
        http.get(`${apiUrl}/api/v1/admin/sangakus`, () => {
          return HttpResponse.json({}, { status: 500 });
        }),
        http.all("*", () => passthrough()),
      ],
      { scope: "test" },
    ],
  });

  test("should not allow me to see sangaku list when API returns error", async ({ page }) => {
    await setAdminSession(page);
    await page.goto("/admin/sangakus");
    await expect(page.getByRole("heading", { name: "算額管理" })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("データを取得できませんでした")).toBeVisible();
    await expect(page.getByText("管理算額テスト")).not.toBeVisible();
  });
});
