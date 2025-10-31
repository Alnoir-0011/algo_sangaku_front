import { setSession } from "@/tests/__helpers__/signin";
import {
  test,
  expect,
  http,
  HttpResponse,
  passthrough,
} from "next/experimental/testmode/playwright/msw";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

const beforeDedicateSangakus = {
  data: [
    {
      id: "1",
      type: "sangaku",
      attributes: {
        title: "test_title",
        description: "test_desc",
        source: "puts 'hi'",
        difficulty: "nomal",
        inputs: [
          {
            id: 1,
            content: "input",
          },
        ],
      },
      relationships: {
        user: {
          data: {
            id: "1",
            type: "user",
          },
        },
        shrine: {
          data: null,
        },
      },
    },
  ],
};

const alreadyDedicateSangakus = {
  data: [
    {
      id: "1",
      type: "sangaku",
      attributes: {
        title: "dedicated",
        description: "test_desc",
        source: "puts 'hi'",
        difficulty: "nomal",
        inputs: [
          {
            id: 1,
            content: "input",
          },
        ],
      },
      relationships: {
        user: {
          data: {
            id: "1",
            type: "user",
          },
        },
        shrine: {
          data: null,
        },
      },
    },
  ],
};

const deleteResponse = {
  data: {
    id: "1",
    type: "sangaku",
    attributes: {
      title: "test_title",
      description: "test_desc",
      source: "puts 'hi'",
      difficulty: "nomal",
      inputs: [
        {
          id: 1,
          content: "input",
        },
      ],
    },
    relationships: {
      user: {
        data: {
          id: "1",
          type: "user",
        },
      },
      shrine: {
        data: null,
      },
    },
  },
};

test.describe("/user/sangakus", () => {
  test.use({
    mswHandlers: [
      [
        http.get(`${apiUrl}/api/v1/user/sangakus`, ({ request }) => {
          const url = new URL(request.url);
          const shrineId = url.searchParams.get("shrine_id");
          if (shrineId === "") {
            return new HttpResponse(JSON.stringify(beforeDedicateSangakus), {
              status: 200,
              headers: {
                "Content-Type": "application/json",
                "current-page": "1",
                "page-items": "20",
                "total-pages": "2",
                "total-count": "22",
              },
            });
          } else {
            return new HttpResponse(JSON.stringify(alreadyDedicateSangakus), {
              status: 200,
              headers: {
                "Content-Type": "application/json",
                "current-page": "1",
                "page-items": "20",
                "total-pages": "2",
                "total-count": "22",
              },
            });
          }
        }),
        http.delete(`${apiUrl}/api/v1/user/sangakus/1`, () => {
          return new HttpResponse(JSON.stringify(deleteResponse), {
            status: 200,
          });
        }),
        // allow all non-mocked routes to pass through
        http.all("*", () => {
          return passthrough();
        }),
      ],
      { scope: "test" }, // or 'worker'
    ],
  });

  test.describe("before signin", () => {
    test("redirect to signin page", async ({ page }) => {
      await page.goto("/user/sangakus");
      await expect(page).toHaveURL("/signin");
      const flash = page.getByText("サインインしてください");
      await expect(flash).toBeVisible();
      const mainNode = page.locator("main");
      const heading = mainNode.getByRole("heading", { name: "サインイン" });
      await expect(heading).toBeVisible();
      await page.reload();
      const drawer = page.locator("nav");
      const link = drawer.getByRole("button", { name: "サインイン" });
      await expect(link).toBeVisible();
    });
  });

  test.describe("after signin", () => {
    test("shuoud allow me to show own sangakus", async ({ page }) => {
      await setSession(page);

      await page.goto("/user/sangakus");
      const sangakuTitle = page.getByRole("heading", { name: "test_title" });
      await expect(sangakuTitle).toBeVisible();
      const menuButton = page.getByTestId("MoreVertIcon");
      await menuButton.click();
      const editLink = page.getByRole("menuitem", { name: "編集" });
      await expect(editLink).toBeVisible();
      await expect(editLink).toHaveAttribute("href", "/user/sangakus/1/edit");
      const deleteButton = page.getByRole("menuitem", { name: "削除" });
      await expect(deleteButton).toBeVisible();
    });

    test("should allow me to show dedicated sangakus", async ({ page }) => {
      await setSession(page);

      await page.goto("/user/sangakus");
      const tab = page.getByRole("tab", { name: "奉納した算額" });
      await tab.click();
      const sangakuTitle = page.getByRole("heading", { name: "dedicated" });
      await expect(sangakuTitle).toBeVisible();
      const menuButton = page.getByTestId("MoreVertIcon");
      await expect(menuButton).not.toBeVisible();
      const editLink = page.getByRole("menuitem", { name: "編集" });
      await expect(editLink).not.toBeVisible();
      const deleteButton = page.getByRole("menuitem", { name: "削除" });
      await expect(deleteButton).not.toBeVisible();
    });

    test("can delete sangaku", async ({ page }) => {
      await setSession(page);
      await page.goto("/user/sangakus");
      const menuButton = page.getByTestId("MoreVertIcon");
      await menuButton.click();
      const deleteButton = page.getByRole("menuitem", { name: "削除" });
      page.once("dialog", async (dialog) => {
        await dialog.accept();
      });
      await deleteButton.click();
      const flash = page.getByText("算額を削除しました");
      await expect(flash).toBeVisible();
    });
  });
});
