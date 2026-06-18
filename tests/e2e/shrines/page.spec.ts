import {
  test,
  expect,
  http,
  HttpResponse,
  passthrough,
} from "@/tests/e2e/fixtures.msw";

const apiUrl = process.env.API_URL;

test.describe("/shrines", () => {
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
