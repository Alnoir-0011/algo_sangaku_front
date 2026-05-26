import { setSession, setAdminSession } from "@/tests/__helpers__/signin";
import {
  test,
  expect,
  http,
  HttpResponse,
  passthrough,
} from "next/experimental/testmode/playwright/msw";

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
    test("should redirect to signin page when accessing /admin/users/[id]/edit", async ({
      page,
    }) => {
      await page.goto("/admin/users/2/edit");
      await expect(page).toHaveURL("/signin");
    });
  });

  test.describe("general user", () => {
    test("should redirect to / when accessing /admin/users/[id]/edit", async ({
      page,
    }) => {
      await setSession(page);
      await page.goto("/admin/users/2/edit");
      await expect(page).toHaveURL("/");
    });
  });

  test.describe("after admin signin", () => {
    test("should display user edit heading", async ({ page }) => {
      await setAdminSession(page);
      await page.goto("/admin/users/2/edit");
      await expect(
        page.getByRole("heading", { name: "ユーザー詳細・編集" }),
      ).toBeVisible();
    });

    test("should pre-fill form with existing user name", async ({ page }) => {
      await setAdminSession(page);
      await page.goto("/admin/users/2/edit");
      await expect(page.getByLabel("名前")).toHaveValue("General User");
    });

    test("should allow updating user", async ({ page }) => {
      await setAdminSession(page);
      await page.goto("/admin/users/2/edit");
      await page.getByLabel("名前").fill("Updated User");
      await page.getByRole("button", { name: "更新" }).click();
      const flash = page.locator(
        '[role="alert"]:not([aria-live]):not([aria-atomic])',
      );
      await expect(flash).toBeVisible({ timeout: 10_000 });
      await expect(flash).toContainText("ユーザーを更新しました");
    });
  });
});
