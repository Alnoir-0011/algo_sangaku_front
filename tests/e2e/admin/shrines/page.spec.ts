import { setSession, setAdminSession } from "@/tests/__helpers__/signin";
import {
  test,
  expect,
  http,
  HttpResponse,
  passthrough,
} from "next/experimental/testmode/playwright/msw";

const apiUrl = process.env.API_URL;

const shrinesResponse = {
  data: [
    {
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
  ],
};

const createResponse = {
  data: {
    id: "2",
    type: "shrine",
    attributes: {
      name: "新しい神社",
      address: "東京都新宿区1-1",
      latitude: 35.6938,
      longitude: 139.7036,
      sangaku_count: 0,
    },
  },
};

test.describe("/admin/shrines", () => {
  test.use({
    mswHandlers: [
      [
        http.get(`${apiUrl}/api/v1/admin/shrines`, () => {
          return new HttpResponse(JSON.stringify(shrinesResponse), {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "current-page": "1",
              "page-items": "20",
              "total-pages": "1",
              "total-count": "1",
            },
          });
        }),
        http.post(`${apiUrl}/api/v1/admin/shrines`, () => {
          return HttpResponse.json(createResponse, { status: 201 });
        }),
        http.all("*", () => {
          return passthrough();
        }),
      ],
      { scope: "test" },
    ],
  });

  test.describe("general user", () => {
    test("should redirect to / when accessing /admin/shrines", async ({
      page,
    }) => {
      await setSession(page);
      await page.goto("/admin/shrines");
      await expect(page).toHaveURL("/");
    });
  });

  test.describe("after admin signin", () => {
    test("should display shrines list heading", async ({ page }) => {
      await setAdminSession(page);
      await page.goto("/admin/shrines");
      await expect(
        page.getByRole("heading", { name: "神社管理" }),
      ).toBeVisible();
    });

    test("should display shrine names from API", async ({ page }) => {
      await setAdminSession(page);
      await page.goto("/admin/shrines");
      await expect(page.getByText("管理神社テスト")).toBeVisible();
    });

    test("should display shrine address from API", async ({ page }) => {
      await setAdminSession(page);
      await page.goto("/admin/shrines");
      await expect(page.getByText("東京都千代田区1-1")).toBeVisible();
    });

    test("should have create shrine button", async ({ page }) => {
      await setAdminSession(page);
      await page.goto("/admin/shrines");
      await expect(
        page.getByRole("link", { name: "神社を追加" }),
      ).toBeVisible();
    });

    test("should have edit link for each shrine", async ({ page }) => {
      await setAdminSession(page);
      await page.goto("/admin/shrines");
      await expect(page.getByRole("link", { name: "編集" })).toBeVisible();
    });
  });
});
