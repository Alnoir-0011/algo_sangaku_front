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
    test("should redirect to / when accessing /admin/sangakus", async ({
      page,
    }) => {
      await setSession(page);
      await page.goto("/admin/sangakus");
      await expect(page).toHaveURL("/");
    });
  });

  test.describe("after admin signin", () => {
    test("should display sangakus list heading", async ({ page }) => {
      await setAdminSession(page);
      await page.goto("/admin/sangakus");
      await expect(
        page.getByRole("heading", { name: "算額管理" }),
      ).toBeVisible();
    });

    test("should display sangaku titles from API", async ({ page }) => {
      await setAdminSession(page);
      await page.goto("/admin/sangakus");
      await expect(page.getByText("管理算額テスト")).toBeVisible();
      await expect(page.getByText("未奉納の算額")).toBeVisible();
    });

    test("should display shrine name when dedicated", async ({ page }) => {
      await setAdminSession(page);
      await page.goto("/admin/sangakus");
      await expect(page.getByText("test_shrine")).toBeVisible();
    });

    test("should display fallback when not dedicated", async ({ page }) => {
      await setAdminSession(page);
      await page.goto("/admin/sangakus");
      await expect(page.getByText("未奉納", { exact: true })).toBeVisible();
    });

    test("should have edit link for each sangaku", async ({ page }) => {
      await setAdminSession(page);
      await page.goto("/admin/sangakus");
      const editLinks = page.getByRole("link", { name: "編集" });
      await expect(editLinks.first()).toBeVisible();
    });
  });
});
