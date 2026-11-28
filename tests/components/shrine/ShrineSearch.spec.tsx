import { test, expect } from "@/tests/fixtures.ct";
import ShrineSearch from "@/app/ui/shrine/ShrineSearch";

// ShrineSearch（位置情報が拒否されたとき）
test.describe("ShrineSearch (geolocation denied)", () => {
  test.use({
    permissions: [],
  });

  // 位置情報が拒否されたとき、位置情報のエラーメッセージが見える
  test("should allow me to see a location error message when geolocation is denied", async ({
    mount,
  }) => {
    const component = await mount(<ShrineSearch />);

    await expect(
      component.getByText("位置情報を取得できませんでした"),
    ).toBeVisible({ timeout: 10_000 });
  });
});

// ShrineSearch（位置情報が許可され、神社が返らなかったとき）
test.describe("ShrineSearch (geolocation granted, no shrines returned)", () => {
  test.use({
    geolocation: { latitude: 35.6809591, longitude: 139.7673068 },
    permissions: ["geolocation"],
  });

  // 位置情報が許可されたとき、位置情報のエラーメッセージが見えない
  test("should not allow me to see the location error message when geolocation is granted", async ({
    mount,
  }) => {
    const component = await mount(<ShrineSearch />);

    await expect(
      component.getByText("位置情報を取得できませんでした"),
    ).not.toBeVisible({ timeout: 10_000 });
  });

  // 神社が返らなかったとき、現在いる神社 の見出しが見えない
  test("should not allow me to see a 現在いる神社 heading when no shrines are returned", async ({
    mount,
  }) => {
    const component = await mount(<ShrineSearch />);

    await expect(component.getByText("現在いる神社")).not.toBeVisible({
      timeout: 10_000,
    });
  });
});
