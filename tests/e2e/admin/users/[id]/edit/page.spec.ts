import { setSession, setAdminSession } from "@/tests/__helpers__/signin";
import {
  test,
  expect,
  http,
  HttpResponse,
  passthrough,
} from "@/tests/e2e/fixtures.msw";

const apiUrl = process.env.API_URL;

const userResponse = {
  data: {
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
};

const updatedUserResponse = {
  data: {
    id: "2",
    type: "user",
    attributes: {
      name: "Updated User",
      email: "general@example.com",
      nickname: "updated",
      role: "admin",
      created_at: "2026-01-02T00:00:00.000+09:00",
      sangaku_count: 3,
      answer_count: 10,
    },
  },
};

test.describe("/admin/users/[id]/edit", () => {
  test.use({
    mswHandlers: [
      [
        http.get(`${apiUrl}/api/v1/admin/users/2`, () => {
          return HttpResponse.json(userResponse, { status: 200 });
        }),
        http.patch(`${apiUrl}/api/v1/admin/users/2`, () => {
          return HttpResponse.json(updatedUserResponse, { status: 200 });
        }),
        http.all("*", () => {
          return passthrough();
        }),
      ],
      { scope: "test" },
    ],
  });

  test.describe("unauthenticated user", () => {
    test("should not allow me to access user edit page without authentication", async ({
      page,
    }) => {
      await page.goto("/admin/users/2/edit");
      await expect(page).toHaveURL("/signin");
      const mainNode = page.locator("main");
      await expect(mainNode.getByRole("heading", { name: "サインイン" })).toBeVisible();
    });
  });

  test.describe("general user", () => {
    test("should not allow me to access user edit page as a general user", async ({
      page,
    }) => {
      await setSession(page);
      await page.goto("/admin/users/2/edit");
      await expect(page).toHaveURL("/");
      await expect(page.getByRole("heading", { name: "アルゴ算額" })).toBeVisible();
    });
  });

  test.describe("after admin signin", () => {
    test("should allow me to see the user edit heading as admin", async ({ page }) => {
      await setAdminSession(page);
      await page.goto("/admin/users/2/edit");
      await expect(
        page.getByRole("heading", { name: "ユーザー詳細・編集" }),
      ).toBeVisible();
    });

    test("should allow me to see the form pre-filled with the existing user name", async ({ page }) => {
      await setAdminSession(page);
      await page.goto("/admin/users/2/edit");
      await expect(page.getByLabel("名前")).toHaveValue("General User");
    });

    test("should allow me to update user", async ({ page }) => {
      await setAdminSession(page);
      await page.goto("/admin/users/2/edit");
      await page.getByLabel("名前").fill("Updated User");
      await page.getByRole("button", { name: "更新" }).click();
      const flash = page.getByTestId('flash-message');
      await expect(flash).toBeVisible({ timeout: 10_000 });
      await expect(flash).toContainText("ユーザーを更新しました");
    });
  });
});

test.describe("/admin/users/[id]/edit (not found)", () => {
  test.use({
    mswHandlers: [
      [
        http.get(`${apiUrl}/api/v1/admin/users/2`, () => {
          return HttpResponse.json({}, { status: 404 });
        }),
        http.all("*", () => passthrough()),
      ],
      { scope: "test" },
    ],
  });

  test("should not allow me to see user edit page when user is not found", async ({ page }) => {
    await setAdminSession(page);
    await page.goto("/admin/users/2/edit");
    await expect(
      page.getByRole("heading", { name: "This page could not be found." }),
    ).toBeVisible({ timeout: 10_000 });
  });
});
