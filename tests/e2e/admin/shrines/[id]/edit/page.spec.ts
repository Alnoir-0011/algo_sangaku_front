import { setSession, setAdminSession } from "@/tests/__helpers__/signin";
import {
  test,
  expect,
  http,
  HttpResponse,
  passthrough,
} from "next/experimental/testmode/playwright/msw";

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

  test.describe("unauthenticated user", () => {
    test("should redirect to signin page when accessing /admin/shrines/[id]/edit", async ({
      page,
    }) => {
      await page.goto("/admin/shrines/1/edit");
      await expect(page).toHaveURL("/signin");
    });
  });

  test.describe("general user", () => {
    test("should redirect to / when accessing /admin/shrines/[id]/edit", async ({
      page,
    }) => {
      await setSession(page);
      await page.goto("/admin/shrines/1/edit");
      await expect(page).toHaveURL("/");
    });
  });

  test.describe("after admin signin", () => {
    test("should display shrine detail heading", async ({ page }) => {
      await setAdminSession(page);
      await page.goto("/admin/shrines/1/edit");
      await expect(
        page.getByRole("heading", { name: "神社詳細・編集" }),
      ).toBeVisible();
    });

    test("should pre-fill form with existing shrine name", async ({ page }) => {
      await setAdminSession(page);
      await page.goto("/admin/shrines/1/edit");
      await expect(page.getByLabel("神社名")).toHaveValue("管理神社テスト");
    });

    test("should allow updating shrine name", async ({ page }) => {
      await setAdminSession(page);
      await page.goto("/admin/shrines/1/edit");
      await page.getByLabel("神社名").fill("更新後の神社名");
      await page.getByRole("button", { name: "更新" }).click();
      const flash = page.locator(
        '[role="alert"]:not([aria-live]):not([aria-atomic])',
      );
      await expect(flash).toBeVisible({ timeout: 10_000 });
      await expect(flash).toContainText("神社を更新しました");
    });
  });
});
