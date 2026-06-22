import { setSession, setAdminSession } from "@/tests/__helpers__/signin";
import {
  test,
  expect,
  http,
  HttpResponse,
  passthrough,
} from "@/tests/e2e/fixtures.msw";

const apiUrl = process.env.API_URL;

const createResponse = {
  data: {
    id: "99",
    type: "shrine",
    attributes: {
      name: "新規神社",
      address: "東京都新宿区1-1",
      latitude: 35.6938,
      longitude: 139.7036,
      sangaku_count: 0,
    },
  },
};

test.describe("/admin/shrines/new", () => {
  test.use({
    mswHandlers: [
      [
        http.post(`${apiUrl}/api/v1/admin/shrines`, () => {
          return HttpResponse.json(createResponse, { status: 201 });
        }),
        http.all("*", () => passthrough()),
      ],
      { scope: "test" },
    ],
  });

  test.describe("general user", () => {
    test("should not allow me to access shrine create page as a general user", async ({ page }) => {
      await setSession(page);
      await page.goto("/admin/shrines/new");
      await expect(page).toHaveURL("/");
      await expect(page.getByRole("heading", { name: "アルゴ算額" })).toBeVisible();
    });
  });

  test.describe("after admin signin", () => {
    test("should allow me to see the shrine create heading as admin", async ({ page }) => {
      await setAdminSession(page);
      await page.goto("/admin/shrines/new");
      await expect(
        page.getByRole("heading", { name: "神社を追加" }),
      ).toBeVisible({ timeout: 10_000 });
    });

    test("should allow me to see all create form fields including address fields", async ({ page }) => {
      await setAdminSession(page);
      await page.goto("/admin/shrines/new");
      await expect(page.getByLabel("神社名")).toBeVisible({ timeout: 10_000 });
      await expect(page.getByLabel("住所")).toBeVisible();
      await expect(page.getByLabel("緯度")).toBeVisible();
      await expect(page.getByLabel("経度")).toBeVisible();
      await expect(page.getByLabel("Place ID")).toBeVisible();
    });

    test("should allow me to see create button with 作成 label", async ({ page }) => {
      await setAdminSession(page);
      await page.goto("/admin/shrines/new");
      await expect(page.getByRole("button", { name: "作成" })).toBeVisible({ timeout: 10_000 });
    });

    test("should allow me to create a shrine", async ({ page }) => {
      await setAdminSession(page);
      await page.goto("/admin/shrines/new");
      await page.getByLabel("神社名").fill("新規神社");
      await page.getByLabel("住所").fill("東京都新宿区1-1");
      await page.getByLabel("緯度").fill("35.6938");
      await page.getByLabel("経度").fill("139.7036");
      await page.getByLabel("Place ID").fill("ChIJtest123");
      await page.getByRole("button", { name: "作成" }).click();
      const flash = page.getByTestId("flash-message");
      await expect(flash).toBeVisible({ timeout: 10_000 });
      await expect(flash).toContainText("神社を作成しました");
    });
  });
});
