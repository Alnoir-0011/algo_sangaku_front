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

test.describe("/admin/users", () => {
  test.use({
    mswHandlers: [
      [
        http.get(`${apiUrl}/api/v1/admin/users`, () => {
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
        }),
        http.all("*", () => {
          return passthrough();
        }),
      ],
      { scope: "test" },
    ],
  });

  test.describe("unauthenticated user", () => {
    test("should not allow me to access user list without authentication", async ({
      page,
    }) => {
      await page.goto("/admin/users");
      await expect(page).toHaveURL("/signin");
    });
  });

  test.describe("general user", () => {
    test("should not allow me to access user list as a general user", async ({
      page,
    }) => {
      await setSession(page);
      await page.goto("/admin/users");
      await expect(page).toHaveURL("/");
    });
  });

  test.describe("after admin signin", () => {
    test("should allow me to see the users list heading as admin", async ({ page }) => {
      await setAdminSession(page);
      await page.goto("/admin/users");
      await expect(
        page.getByRole("heading", { name: "ユーザー管理" }),
      ).toBeVisible();
    });

    test("should allow me to see user names from API", async ({ page }) => {
      await setAdminSession(page);
      await page.goto("/admin/users");
      await expect(page.getByText("Admin User")).toBeVisible();
      await expect(page.getByText("General User")).toBeVisible();
    });

    test("should allow me to see the edit link for each user", async ({ page }) => {
      await setAdminSession(page);
      await page.goto("/admin/users");
      const editLinks = page.getByRole("link", { name: "編集" });
      await expect(editLinks.first()).toBeVisible();
    });
  });
});
