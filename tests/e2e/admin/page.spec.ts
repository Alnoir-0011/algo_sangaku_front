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
    test("should redirect to signin page when accessing /admin", async ({
      page,
    }) => {
      await page.goto("/admin");
      await expect(page).toHaveURL("/signin");
    });
  });

  test.describe("general user", () => {
    test("should redirect to / when accessing /admin", async ({ page }) => {
      await setSession(page);
      await page.goto("/admin");
      await expect(page).toHaveURL("/");
    });
  });

  test.describe("after admin signin", () => {
    test("should display dashboard heading", async ({ page }) => {
      await setAdminSession(page);
      await page.goto("/admin");
      await expect(
        page.getByRole("heading", { name: "管理ダッシュボード" }),
      ).toBeVisible();
    });

    test("should display users count from API", async ({ page }) => {
      await setAdminSession(page);
      await page.goto("/admin");
      await expect(page.getByText("42")).toBeVisible();
    });

    test("should display sangakus count from API", async ({ page }) => {
      await setAdminSession(page);
      await page.goto("/admin");
      await expect(page.getByText("15")).toBeVisible();
    });

    test("should display shrines count from API", async ({ page }) => {
      await setAdminSession(page);
      await page.goto("/admin");
      await expect(page.getByText("8")).toBeVisible();
    });

    test("should display answers count from API", async ({ page }) => {
      await setAdminSession(page);
      await page.goto("/admin");
      await expect(page.getByText("100")).toBeVisible();
    });

    test("should have navigation links to management pages", async ({
      page,
    }) => {
      await setAdminSession(page);
      await page.goto("/admin");
      await expect(
        page.getByRole("link", { name: "ユーザー管理" }),
      ).toBeVisible();
      await expect(page.getByRole("link", { name: "算額管理" })).toBeVisible();
      await expect(page.getByRole("link", { name: "神社管理" })).toBeVisible();
    });
  });
});
