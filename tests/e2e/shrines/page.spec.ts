import {
  test,
  expect,
  http,
  HttpResponse,
  passthrough,
} from "@/tests/e2e/fixtures.msw";

const apiUrl = process.env.API_URL;

const shrinesListResponse = {
  data: [
    {
      id: "1",
      type: "shrine",
      attributes: {
        name: "テスト神社",
        address: "東京都千代田区1-1",
        latitude: "35.6809591",
        longitude: "139.7673068",
        place_id: "ChIJtest001",
      },
    },
  ],
};

test.describe("/shrines (429 error)", () => {
  test.use({
    geolocation: { latitude: 35.6809591, longitude: 139.7673068 },
    permissions: ["geolocation"],
    mswHandlers: [
      [
        // レート制限（429）を再現する
        http.get(`${apiUrl}/api/v1/shrines`, () => {
          return new HttpResponse(null, { status: 429 });
        }),
        // それ以外（Google Maps JS など）は通す
        http.all("*", () => passthrough()),
      ],
      { scope: "test" },
    ],
  });

  test("should allow me to see a warning flash when 429 is returned on area search", async ({
    page,
  }) => {
    await page.goto("/shrines");

    const button = page.getByRole("button", { name: "このエリアで探す" });
    await expect(button).toBeVisible();
    await button.click();

    const flash = page.getByTestId('flash-message');
    await expect(flash).toBeVisible({ timeout: 10_000 });
    await expect(flash).toContainText(
      "リクエストが多すぎます。しばらくしてから再試行してください。",
    );
  });
});

test.describe("/shrines (successful load)", () => {
  test.use({
    geolocation: { latitude: 35.6809591, longitude: 139.7673068 },
    permissions: ["geolocation"],
    mswHandlers: [
      [
        http.get(`${apiUrl}/api/v1/shrines`, () => {
          return HttpResponse.json(shrinesListResponse, { status: 200 });
        }),
        http.all("*", () => passthrough()),
      ],
      { scope: "test" },
    ],
  });

  test("should not allow me to see an error flash when performing area search", async ({ page }) => {
    await page.goto("/shrines");
    const button = page.getByRole("button", { name: "このエリアで探す" });
    await expect(button).toBeVisible({ timeout: 10_000 });
    // ボタン再クリックで completeLoadEvent が true の状態で loadShrines が呼ばれる
    await button.click();
    await expect(page.getByTestId('flash-message')).not.toBeVisible({ timeout: 3_000 });
  });

  test("should allow me to see the area search button when navigating with lat/lng query params", async ({ page }) => {
    // lat/lng クエリパラメータ付きで遷移すると zoom=18 が設定される（Map.tsx の if (lat && lng) ブランチ）
    await page.goto("/shrines?lat=35.6809591&lng=139.7673068");
    const button = page.getByRole("button", { name: "このエリアで探す" });
    await expect(button).toBeVisible({ timeout: 10_000 });
  });
});
