import { setSession, setAdminSession } from "@/tests/__helpers__/signin";
import {
  test,
  expect,
  http,
  HttpResponse,
  passthrough,
} from "@/tests/e2e/fixtures.msw";

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
    test("should not allow me to access shrine edit page without authentication", async ({
      page,
    }) => {
      await page.goto("/admin/shrines/1/edit");
      await expect(page).toHaveURL("/signin");
    });
  });

  test.describe("general user", () => {
    test("should not allow me to access shrine edit page as a general user", async ({
      page,
    }) => {
      await setSession(page);
      await page.goto("/admin/shrines/1/edit");
      await expect(page).toHaveURL("/");
      await expect(page.getByRole("heading", { name: "アルゴ算額" })).toBeVisible();
    });
  });

  test.describe("after admin signin", () => {
    test("should allow me to see the shrine detail heading as admin", async ({ page }) => {
      await setAdminSession(page);
      await page.goto("/admin/shrines/1/edit");
      await expect(
        page.getByRole("heading", { name: "神社詳細・編集" }),
      ).toBeVisible();
    });

    test("should allow me to see the form pre-filled with the existing shrine name", async ({ page }) => {
      await setAdminSession(page);
      await page.goto("/admin/shrines/1/edit");
      await expect(page.getByLabel("神社名")).toHaveValue("管理神社テスト");
    });

    test("should allow me to update shrine name", async ({ page }) => {
      await setAdminSession(page);
      await page.goto("/admin/shrines/1/edit");
      await page.getByLabel("神社名").fill("更新後の神社名");
      await page.getByRole("button", { name: "更新" }).click();
      const flash = page.getByTestId('flash-message');
      await expect(flash).toBeVisible({ timeout: 10_000 });
      await expect(flash).toContainText("神社を更新しました");
    });
  });
});
