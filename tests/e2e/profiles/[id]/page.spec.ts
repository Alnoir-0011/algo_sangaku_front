import {
  test,
  expect,
  http,
  HttpResponse,
  passthrough,
} from "next/experimental/testmode/playwright/msw";

const apiUrl = process.env.API_URL;

const profileWithAnswerCount = {
  data: {
    id: "1",
    type: "profile",
    attributes: {
      nickname: "test nickname",
      created_at: "2026-01-01T00:00:00.000+09:00",
      sangaku_count: 2,
      dedicated_sangaku_count: 1,
      answer_count: 5,
      dedicated_sangakus: [
        { id: 1, title: "test_sangaku_title", shrine_name: "test_shrine" },
      ],
    },
  },
};

const profileWithoutAnswerCount = {
  data: {
    id: "2",
    type: "profile",
    attributes: {
      nickname: "private nickname",
      created_at: "2026-02-01T00:00:00.000+09:00",
      sangaku_count: 3,
      dedicated_sangaku_count: 0,
      answer_count: null,
      dedicated_sangakus: [],
    },
  },
};

test.describe("/profiles/[id]", () => {
  test.use({
    mswHandlers: [
      [
        http.get(`${apiUrl}/api/v1/profiles/1`, () => {
          return HttpResponse.json(profileWithAnswerCount, { status: 200 });
        }),
        http.get(`${apiUrl}/api/v1/profiles/2`, () => {
          return HttpResponse.json(profileWithoutAnswerCount, { status: 200 });
        }),
        http.get(`${apiUrl}/api/v1/profiles/999`, () => {
          return new HttpResponse(null, { status: 404 });
        }),
        http.all("*", () => passthrough()),
      ],
      { scope: "test" },
    ],
  });

  test.describe("without signin (public route)", () => {
    test("should display nickname and registration date", async ({ page }) => {
      await page.goto("/profiles/1");
      await page.waitForLoadState();

      await expect(page.getByRole("heading", { name: "プロフィール" })).toBeVisible();
      // nickname renders as <h6> (Typography variant="h6")
      await expect(page.getByRole("heading", { name: "test nickname" })).toBeVisible();
      await expect(page.getByText(/登録日.*2026/)).toBeVisible();
    });

    test("should display activity summary", async ({ page }) => {
      await page.goto("/profiles/1");
      await page.waitForLoadState();

      // subtitle1 renders as <h6>
      await expect(page.getByRole("heading", { name: "活動サマリー" })).toBeVisible();
      await expect(page.getByText("作成した算額")).toBeVisible();
      // "奉納済み算額" appears in both StatCard label (span) and section heading (h6)
      // target only the caption span inside the activity summary stat card
      await expect(
        page.locator("span").filter({ hasText: /^奉納済み算額$/ }),
      ).toBeVisible();
    });

    test("should display answer count as number when show_answer_count is true", async ({
      page,
    }) => {
      await page.goto("/profiles/1");
      await page.waitForLoadState();

      await expect(page.getByText("提出した回答")).toBeVisible();
      const answerCard = page
        .getByText("提出した回答")
        .locator("..")
        .locator("..");
      await expect(answerCard.getByText("5")).toBeVisible();
    });

    test("should display dash when answer_count is null (show_answer_count is false)", async ({
      page,
    }) => {
      await page.goto("/profiles/2");
      await page.waitForLoadState();

      await expect(page.getByText("提出した回答")).toBeVisible();
      const answerCard = page
        .getByText("提出した回答")
        .locator("..")
        .locator("..");
      await expect(answerCard.getByText("—")).toBeVisible();
    });

    test("should display dedicated sangaku list with title and shrine name", async ({
      page,
    }) => {
      await page.goto("/profiles/1");
      await page.waitForLoadState();

      // section heading (subtitle1 = h6)
      await expect(page.getByRole("heading", { name: "奉納済み算額" })).toBeVisible();
      // sangaku title and shrine name inside Ema component
      await expect(page.getByText("test_sangaku_title")).toBeVisible();
      await expect(page.getByText("test_shrine")).toBeVisible();
    });

    test("should display empty message when no dedicated sangakus", async ({
      page,
    }) => {
      await page.goto("/profiles/2");
      await page.waitForLoadState();

      await expect(
        page.getByText("奉納済みの算額はありません"),
      ).toBeVisible();
    });

    test("should display not found page for non-existent id", async ({
      page,
    }) => {
      await page.goto("/profiles/999");
      await page.waitForLoadState();

      await expect(
        page.getByRole("heading", { name: "This page could not be found." }),
      ).toBeVisible();
    });
  });
});
