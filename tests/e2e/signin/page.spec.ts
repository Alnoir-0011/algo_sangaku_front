import { test, expect } from "@/tests/e2e/fixtures";
import { setSession } from "../../__helpers__/signin";

// /signin ページ
test.describe("/signin", () => {
  // サインイン前
  test.describe("before login", () => {
    // 見出しがある
    test("has heading", async ({ page }) => {
      await page.goto("/signin");
      const heading = page.getByRole("heading", { name: "サインイン" });
      await expect(heading).toBeVisible();
    });

    // 通常どおりサインインページを開いても、サインインエラーが見えない
    test("should not allow me to see the sign-in error when I open the sign-in page normally", async ({
      page,
    }) => {
      await page.goto("/signin");
      await expect(
        page.getByRole("button", { name: "Googleでサインイン" }),
      ).toBeVisible();

      // role="alert" は、Next のルート通知も持つため、文言で特定する
      await expect(page.getByText("サインインに失敗しました")).toHaveCount(0);
    });

    // エラー付きで戻されたとき、サインインエラーが見える
    test("should allow me to see the sign-in error when I am sent back with an error", async ({
      page,
    }) => {
      await page.goto("/signin?error=access_denied");

      await expect(page.getByText("サインインに失敗しました")).toBeVisible();
      // エラーのコードは、画面に出さない
      await expect(page.getByText("access_denied")).toHaveCount(0);
      await expect(
        page.getByRole("button", { name: "Googleでサインイン" }),
      ).toBeVisible();
    });
  });

  // ドロワーのサインインボタン
  test.describe("sign-in button of the drawer", () => {
    // 開いていたページの情報付きで、サインインページへ移動できる
    test("should allow me to be sent to the sign-in page with the page I was on", async ({
      page,
    }) => {
      await page.goto("/shrines?searchType=Map");
      await page.getByRole("button", { name: "サインイン", exact: true }).click();

      await expect(page).toHaveURL(
        "/signin?callbackUrl=%2Fshrines%3FsearchType%3DMap",
      );
    });

    // サインインページでサインインボタンを押しても、開いていたページが失われない
    test("should not allow the page I was on to be lost when I press it on the sign-in page", async ({
      page,
    }) => {
      const navigations: string[] = [];
      page.on("framenavigated", (frame) => {
        if (frame === page.mainFrame()) navigations.push(frame.url());
      });
      await page.goto("/signin?callbackUrl=%2Fshrines%3FsearchType%3DMap");
      // ハイドレーション前のクリックは、何も起こさず、このテストを空振りさせる
      await page.waitForLoadState("networkidle");
      const navigationsBeforeClick = navigations.length;

      await page.getByRole("button", { name: "サインイン", exact: true }).click();
      await page.waitForLoadState("networkidle");

      expect(navigations.length).toBe(navigationsBeforeClick);
      await expect(page).toHaveURL(
        "/signin?callbackUrl=%2Fshrines%3FsearchType%3DMap",
      );
    });
  });

  // サインイン後
  test.describe("after signin", () => {
    // サインイン済みのとき、ルートへリダイレクトされる
    test("should allow me to be redirected to root when already signed in", async ({ page }) => {
      await setSession(page);
      await page.goto("/signin");
      await expect(page).toHaveURL("/");
    });
  });
});
