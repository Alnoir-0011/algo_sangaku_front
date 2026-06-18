import { setSession, setAdminSession } from "@/tests/__helpers__/signin";
import {
  test,
  expect,
  http,
  HttpResponse,
  passthrough,
} from "@/tests/e2e/fixtures.msw";

const apiUrl = process.env.API_URL;

const statsResponse = {
  data: {
    users_count: 42,
    sangakus_count: 15,
    shrines_count: 8,
    answers_count: 100,
  },
};

test.describe("/admin (dashboard)", () => {
  test.use({
    mswHandlers: [
      [
        http.get(`${apiUrl}/api/v1/admin/stats`, () => {
          return HttpResponse.json(statsResponse, { status: 200 });
        }),
        http.all("*", () => {
          return passthrough();
        }),
      ],
      { scope: "test" },
    ],
  });

  test.describe("unauthenticated user", () => {
    test("should not allow me to access dashboard without authentication", async ({
      page,
    }) => {
      await page.goto("/admin");
      await expect(page).toHaveURL("/signin");
    });
  });

  test.describe("general user", () => {
    test("should not allow me to access dashboard as a general user", async ({ page }) => {
      await setSession(page);
      await page.goto("/admin");
      await expect(page).toHaveURL("/");
    });
  });

  test.describe("after admin signin", () => {
    test.beforeEach(async ({ page }) => {
      await setAdminSession(page);
      await page.goto("/admin");
    });

    test("should allow me to see the dashboard heading as admin", async ({ page }) => {
      await expect(
        page.getByRole("heading", { name: "管理ダッシュボード" }),
      ).toBeVisible();
    });

    test("should allow me to see users count from API", async ({ page }) => {
      await expect(page.getByTestId("users_count")).toContainText("42");
    });

    test("should allow me to see sangakus count from API", async ({ page }) => {
      await expect(page.getByTestId("sangakus_count")).toContainText("15");
    });

    test("should allow me to see shrines count from API", async ({ page }) => {
      await expect(page.getByTestId("shrines_count")).toContainText("8");
    });

    test("should allow me to see answers count from API", async ({ page }) => {
      await expect(page.getByTestId("answers_count")).toContainText("100");
    });

    test("should allow me to see navigation links to management pages", async ({ page }) => {
      await expect(
        page.getByRole("link", { name: "ユーザー管理" }),
      ).toBeVisible();
      await expect(page.getByRole("link", { name: "算額管理" })).toBeVisible();
      await expect(page.getByRole("link", { name: "神社管理" })).toBeVisible();
    });
  });
});
