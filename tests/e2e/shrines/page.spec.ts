import { waitForHydration } from "@/tests/__helpers__/hydration";
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

test.describe("/shrines (map center and zoom)", () => {
  // 実装の初期値（東京駅）と異なる座標にして、現在地が使われることを区別できるようにする
  test.use({
    geolocation: { latitude: 34.6937, longitude: 135.5023 },
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

  test("should allow me to see the map centered on my current location with zoom 16 when there are no query params", async ({
    page,
  }) => {
    await page.goto("/shrines");

    const map = page.getByTestId("map-mock");
    await expect(map).toHaveAttribute(
      "data-default-center",
      JSON.stringify({ lat: 34.6937, lng: 135.5023 }),
    );
    await expect(map).toHaveAttribute("data-default-zoom", "16");
  });

  test("should allow me to see the map centered on the lat/lng query params with zoom 18", async ({
    page,
  }) => {
    // 現在地と異なる座標にして、現在地ではなくクエリが使われることを確認する
    await page.goto("/shrines?lat=35.7&lng=139.8");

    const map = page.getByTestId("map-mock");
    await expect(map).toHaveAttribute(
      "data-default-center",
      JSON.stringify({ lat: 35.7, lng: 139.8 }),
    );
    await expect(map).toHaveAttribute("data-default-zoom", "18");
  });

  test("should allow me to see the map centered again when the lat/lng query params change without a page reload", async ({
    page,
  }) => {
    await page.goto("/shrines");
    const map = page.getByTestId("map-mock");
    await expect(map).toHaveAttribute("data-default-zoom", "16");
    await waitForHydration(map);

    // Next のクライアントルーターで、ページを読み込み直さずにクエリだけを変える
    await page.evaluate(() => {
      (
        window as unknown as { next: { router: { push: (url: string) => void } } }
      ).next.router.push("/shrines?lat=35.7&lng=139.8");
    });

    await expect(map).toHaveAttribute(
      "data-default-center",
      JSON.stringify({ lat: 35.7, lng: 139.8 }),
    );
    await expect(map).toHaveAttribute("data-default-zoom", "18");
  });
});

test.describe("/shrines (area search in progress)", () => {
  test.use({
    geolocation: { latitude: 35.6809591, longitude: 139.7673068 },
    permissions: ["geolocation"],
  });

  test("should not allow me to click the area search button while the search is in progress", async ({
    page,
    msw,
  }) => {
    let releaseShrines!: () => void;
    const shrinesReleased = new Promise<void>((resolve) => {
      releaseShrines = resolve;
    });
    let shrineRequests = 0;
    msw.use(
      http.get(`${apiUrl}/api/v1/shrines`, async () => {
        shrineRequests += 1;
        await shrinesReleased;
        return HttpResponse.json(shrinesListResponse, { status: 200 });
      }),
      http.all("*", () => passthrough()),
    );
    await page.goto("/shrines");
    const button = page.getByRole("button", { name: "このエリアで探す" });
    await waitForHydration(button);

    try {
      await button.click();

      await expect(button).toBeDisabled();
      // ボタンは押した直後に無効になるが、リクエストが API に届くまでには少し遅れる
      await expect.poll(() => shrineRequests).toBe(1);
    } finally {
      releaseShrines();
    }

    await expect(button).toBeEnabled();
    await expect(page.getByTestId("advanced-marker-mock")).toHaveCount(1);
  });
});

test.describe("/shrines search tab (geolocation success, nearby shrine)", () => {
  const nearShrine = {
    id: "1",
    type: "shrine",
    attributes: {
      name: "現在地の神社",
      address: "東京都千代田区1-1",
      latitude: 35.6809591,
      longitude: 139.7673068,
      place_id: "ChIJtest001",
      sangaku_count: 10,
    },
  };
  const farShrine = {
    id: "2",
    type: "shrine",
    attributes: {
      name: "離れた神社",
      address: "東京都新宿区1-1",
      latitude: 35.6896067,
      longitude: 139.7005713,
      place_id: "ChIJtest002",
      sangaku_count: 3,
    },
  };

  test.use({
    geolocation: { latitude: 35.6809591, longitude: 139.7673068 },
    permissions: ["geolocation"],
    mswHandlers: [
      [
        http.get(`${apiUrl}/api/v1/shrines`, ({ request }) => {
          const url = new URL(request.url);
          if (url.searchParams.get("searchType") === "List") {
            return HttpResponse.json(
              { data: [nearShrine, farShrine] },
              { status: 200 },
            );
          }
          return HttpResponse.json(shrinesListResponse, { status: 200 });
        }),
        http.all("*", () => passthrough()),
      ],
      { scope: "test" },
    ],
  });

  test("should allow me to switch to the search tab and see the 現在いる神社 block without duplicating it in the list", async ({
    page,
  }) => {
    await page.goto("/shrines");
    await page.getByRole("tab", { name: "検索" }).click();
    await expect(page).toHaveURL(/tab=search/);

    await expect(page.getByText("現在いる神社")).toBeVisible({
      timeout: 10_000,
    });

    const nearCard = page.getByText("現在地の神社");
    const farCard = page.getByText("離れた神社");
    await expect(nearCard).toHaveCount(1);
    await expect(farCard).toHaveCount(1);
  });

  test("should allow me to see action links only for the shrine within the 100m geofence", async ({
    page,
  }) => {
    await page.goto("/shrines?tab=search");

    await expect(page.getByText("現在いる神社")).toBeVisible({
      timeout: 10_000,
    });
    await expect(
      page.getByRole("link", { name: "算額を見る" }),
    ).toHaveCount(1);
    await expect(
      page.getByRole("link", { name: "算額を奉納する" }),
    ).toHaveCount(1);
    await expect(page.getByText("神社から離れています")).toBeVisible();
  });
});

test.describe("/shrines search tab (geolocation success, no nearby shrine)", () => {
  const farShrine = {
    id: "2",
    type: "shrine",
    attributes: {
      name: "離れた神社",
      address: "東京都新宿区1-1",
      latitude: 35.6896067,
      longitude: 139.7005713,
      place_id: "ChIJtest002",
      sangaku_count: 3,
    },
  };

  test.use({
    geolocation: { latitude: 35.6809591, longitude: 139.7673068 },
    permissions: ["geolocation"],
    mswHandlers: [
      [
        http.get(`${apiUrl}/api/v1/shrines`, ({ request }) => {
          const url = new URL(request.url);
          if (url.searchParams.get("searchType") === "List") {
            return HttpResponse.json({ data: [farShrine] }, { status: 200 });
          }
          return HttpResponse.json(shrinesListResponse, { status: 200 });
        }),
        http.all("*", () => passthrough()),
      ],
      { scope: "test" },
    ],
  });

  test("should not allow me to see the 現在いる神社 block when no shrine is within 100m", async ({
    page,
  }) => {
    await page.goto("/shrines?tab=search");

    await expect(page.getByText("離れた神社")).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText("現在いる神社")).not.toBeVisible();
  });
});

test.describe("/shrines search tab (geolocation denied)", () => {
  test.use({
    permissions: [],
  });

  test("should allow me to see a location error message when geolocation is denied", async ({
    page,
  }) => {
    await page.goto("/shrines?tab=search");

    await expect(
      page.getByText("位置情報を取得できませんでした"),
    ).toBeVisible({ timeout: 10_000 });
  });
});

test.describe("/shrines search tab (429 error)", () => {
  test.use({
    geolocation: { latitude: 35.6809591, longitude: 139.7673068 },
    permissions: ["geolocation"],
    mswHandlers: [
      [
        http.get(`${apiUrl}/api/v1/shrines`, ({ request }) => {
          const url = new URL(request.url);
          if (url.searchParams.get("searchType") === "List") {
            return new HttpResponse(null, { status: 429 });
          }
          return HttpResponse.json(shrinesListResponse, { status: 200 });
        }),
        http.all("*", () => passthrough()),
      ],
      { scope: "test" },
    ],
  });

  test("should allow me to see a warning flash when 429 is returned on search tab load", async ({
    page,
  }) => {
    await page.goto("/shrines?tab=search");

    const flash = page.getByTestId("flash-message");
    await expect(flash).toBeVisible({ timeout: 10_000 });
    await expect(flash).toContainText(
      "リクエストが多すぎます。しばらくしてから再試行してください。",
    );
  });
});
