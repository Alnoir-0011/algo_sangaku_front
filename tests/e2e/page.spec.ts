import {
  test,
  expect,
  http,
  HttpResponse,
} from "@/tests/e2e/fixtures.msw";
import { setSession } from "../__helpers__/signin";
import { DEFAULT_ACCESS_TOKEN } from "../__helpers__/test-auth";

const apiUrl = process.env.API_URL;

// トップページ
test.describe("TopPage", () => {
  // メインノード
  test.describe("mainNode", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/");
    });

    // タイトルがある
    test("has title", async ({ page }) => {
      await expect(
        page.getByRole("heading", { name: "アルゴ算額" }),
      ).toBeVisible();
    });

    // 説明がある
    test("has description", async ({ page }) => {
      const mainNode = page.locator("main");
      await expect(
        mainNode.getByText(
          "算額とは、神社や寺院に奉納された和算の絵馬のことで、日本独自に広まった文化だと言われています。難問が多いですが、問題が解けた喜びを神仏に感謝したり、学業成就を祈願する風習として親しまれてきました。",
          { exact: true },
        ),
      ).toBeVisible();
    });

    // createSangaku ページへのリンクがある
    test("has link to createSangaku page", async ({ page }) => {
      const mainNode = page.locator("main");
      const link = mainNode.getByRole("link", { name: "算額を作る" });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("href", "/sangakus/create");
    });

    // showSangakus ページへのリンクがある
    test("has link to showSangakus page", async ({ page }) => {
      const mainNode = page.locator("main");
      const link = mainNode.getByRole("link", { name: "算額を確認" });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("href", "/user/sangakus");
    });

    // map ページへのリンクがある
    test("has link to map page", async ({ page }) => {
      const mainNode = page.locator("main");
      const link = mainNode.getByRole("link", { name: "神社を探す" });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("href", "/shrines");
    });

    // answerSangaku ページへのリンクがある
    test("has link to answerSangaku page", async ({ page }) => {
      const mainNode = page.locator("main");
      const link = mainNode.getByRole("link", { name: "算額を解く" });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("href", "/saved_sangakus");
    });
  });

  // ドロワー
  test.describe("Drawer", () => {
    // サインイン前
    test.describe("before login", () => {
      // サインインボタンを押すと、サインインページに Google サインインボタンが見える
      test("should allow me to see the Google sign-in button on the sign-in page when I press the sign in button", async ({ page }) => {
        await page.goto("/");
        const button = page.getByRole("button", { name: "サインイン" });
        await button.click();
        await expect(page).toHaveURL(/\/signin/);
        await expect(
          page.getByRole("button", { name: "Googleでサインイン" }),
        ).toBeVisible();
      });
    });

    // サインイン後
    test.describe("after login", () => {
      // ドロワーに、サインイン済みユーザー向けのメニューが見える
      test("should allow me to see the menu for signed-in users in the drawer", async ({ page }) => {
        await setSession(page);
        await page.goto("/");

        const drawer = page.getByRole("navigation");
        await expect(
          drawer.getByRole("button", { name: "サインアウト" }),
        ).toBeVisible();
        const link = drawer.getByRole("link", { name: "アルゴ算額" });
        await expect(link).toBeVisible();
        await expect(link).toHaveAttribute("href", "/");
      });

      // サインイン後、サインインボタンが見えない
      test("should not allow me to see the sign in button after login", async ({ page }) => {
        await setSession(page);
        await page.goto("/");
        // ページが想定外の状態でも通らないよう、ログイン中のメニューが出ていることを先に確かめる
        await expect(
          page.getByRole("button", { name: "サインアウト" }),
        ).toBeVisible();
        const button = page.getByRole("button", { name: "サインイン" });
        await expect(button).not.toBeVisible({ timeout: 5_000 });
      });

      // 確認すると、サインアウトできる
      test("should allow me to sign out when confirmed", async ({ page, msw }) => {
        msw.use(
          http.delete(`${apiUrl}/api/v1/authenticate`, () => {
            return HttpResponse.json({}, { status: 200 });
          }),
        );
        await setSession(page);
        await page.goto("/");

        // window.confirm を true で上書きしてサインアウト確認OKをシミュレート
        await page.evaluate(() => {
          window.confirm = () => true;
        });
        await page.getByRole("button", { name: "サインアウト" }).click();
        await expect(page).toHaveURL("/signin", { timeout: 10_000 });
      });

      // サインアウトでき、バックエンドで API キーが削除される
      test("should allow me to sign out and have my API key deleted at the backend", async ({
        page,
        msw,
      }) => {
        const deletedWith: (string | null)[] = [];
        msw.use(
          http.delete(`${apiUrl}/api/v1/authenticate`, ({ request }) => {
            deletedWith.push(request.headers.get("Authorization"));
            return HttpResponse.json({}, { status: 200 });
          }),
        );
        await setSession(page);
        await page.goto("/");

        await page.evaluate(() => {
          window.confirm = () => true;
        });
        await page.getByRole("button", { name: "サインアウト" }).click();
        await expect(page).toHaveURL("/signin", { timeout: 10_000 });

        expect(deletedWith).toEqual([`Bearer ${DEFAULT_ACCESS_TOKEN}`]);
      });

      // サインアウト直後に、サインインメニューが見える
      test("should allow me to see the sign-in menu right after I sign out", async ({
        page,
        msw,
      }) => {
        msw.use(
          http.delete(`${apiUrl}/api/v1/authenticate`, () => {
            return HttpResponse.json({}, { status: 200 });
          }),
        );
        await setSession(page);
        await page.goto("/");

        await page.evaluate(() => {
          window.confirm = () => true;
        });
        await page.getByRole("button", { name: "サインアウト" }).click();
        await expect(page).toHaveURL("/signin", { timeout: 10_000 });

        // Server Action のサインアウトは、クライアントの useSession に伝わらない。
        // 遷移時の再取得（SessionSync）で、ログイン中のメニューが残らないことを確認する
        await expect(
          page.getByRole("button", { name: "サインイン", exact: true }),
        ).toBeVisible({ timeout: 5_000 });
        await expect(
          page.getByRole("button", { name: "サインアウト" }),
        ).not.toBeVisible();
        await expect(page.getByText("サインアウトしました")).toBeVisible();
      });

      for (const { reason, respond } of [
        { reason: "responds with an error", respond: () => HttpResponse.json({}, { status: 500 }) },
        { reason: "cannot be reached", respond: () => HttpResponse.error() },
      ]) {
        // バックエンドがエラーを返す場合や、到達できない場合でも、サインアウトできる
        test(`should allow me to sign out even when the backend ${reason}`, async ({
          page,
          msw,
        }) => {
          msw.use(http.delete(`${apiUrl}/api/v1/authenticate`, respond));
          await setSession(page);
          await page.goto("/");

          await page.evaluate(() => {
            window.confirm = () => true;
          });
          await page.getByRole("button", { name: "サインアウト" }).click();
          await expect(page).toHaveURL("/signin", { timeout: 10_000 });
        });
      }

      // キャンセルすると、サインアウトできない
      test("should not allow me to sign out when dismissed", async ({
        page,
      }) => {
        // Server Action は、next-action ヘッダー付きの POST で呼ばれる。ページの表示時にも
        // 別の Server Action が走るため、クリック前後の増減で確かめる。
        // 遷移や表示の確認だけだと、キャンセルを無視して実行される実装でも、実行前の状態を見て通る
        const serverActionRequests: string[] = [];
        page.on("request", (request) => {
          if (request.method() === "POST" && request.headers()["next-action"]) {
            serverActionRequests.push(request.url());
          }
        });
        await setSession(page);
        await page.goto("/");
        await page.waitForLoadState("networkidle");
        const requestsBeforeClick = serverActionRequests.length;

        // window.confirm を false で上書きしてキャンセルをシミュレート
        await page.evaluate(() => {
          (window as unknown as { confirmCalls: number }).confirmCalls = 0;
          window.confirm = () => {
            (window as unknown as { confirmCalls: number }).confirmCalls += 1;
            return false;
          };
        });
        await page.getByRole("button", { name: "サインアウト" }).click();
        await expect
          .poll(() =>
            page.evaluate(
              () => (window as unknown as { confirmCalls: number }).confirmCalls,
            ),
          )
          .toBe(1);
        await page.waitForLoadState("networkidle");

        expect(serverActionRequests).toHaveLength(requestsBeforeClick);
        await expect(page).toHaveURL("/");
        // キャンセル後もサインアウトボタンが残っていること（セッションが維持されていること）を確認
        await expect(page.getByRole("button", { name: "サインアウト" })).toBeVisible();
      });
    });
  });

  // モバイル
  test.describe("mobile", () => {
    test.use({ viewport: { width: 430, height: 932 } });

    // モバイルでメニューボタンをクリックすると、ドロワーを開ける
    test("should allow me to open the drawer by clicking the menu button on mobile", async ({ page }) => {
      await page.goto("/");
      await page.getByRole("button", { name: "open drawer" }).click();
      const appName = page.getByRole("link", { name: "アルゴ算額" });
      await expect(appName).toBeVisible();
    });

    // Escape キーを押すと、ドロワーを閉じられる
    test("should allow me to close the drawer by pressing Escape key", async ({ page }) => {
      await page.goto("/");
      await page.getByRole("button", { name: "open drawer" }).click();
      const mobileDrawer = page.getByTestId("mobileDrawer");
      await expect(mobileDrawer).toBeVisible({ timeout: 5_000 });
      await page.keyboard.press("Escape");
      await expect(mobileDrawer).not.toBeVisible({ timeout: 5_000 });
    });
  });
});
