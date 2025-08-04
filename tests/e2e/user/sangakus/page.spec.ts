import { setSession } from "@/tests/__helpers__/signin";
import {
  test,
  expect,
  http,
  HttpResponse,
  passthrough,
} from "next/experimental/testmode/playwright/msw";

const fetchResponse = {
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
        http.get("http://localhost:3000/api/v1/user/sangakus", () => {
          return new HttpResponse(JSON.stringify(fetchResponse), {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "current-page": "1",
              "page-items": "20",
              "total-pages": "2",
              "total-count": "22",
            },
          });
        }),
        http.delete("http://localhost:3000/api/v1/user/sangakus/1", () => {
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
    test("redirect to root", async ({ page }) => {
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
    test("display signin user's sangakus", async ({ page }) => {
      await setSession(page);

      await page.goto("/user/sangakus");
      const sangakuTitle = page.getByRole("heading", { name: "test_title" });
      await expect(sangakuTitle).toBeVisible();
      const menuButton = page.getByTestId("MoreVertIcon");
      await menuButton.click();
      const editLink = page.getByRole("menuitem", { name: "編集" });
      await expect(editLink).toBeVisible();
      await expect(editLink).toHaveAttribute("href", "#");
      const deleteButton = page.getByRole("menuitem", { name: "削除" });
      await expect(deleteButton).toBeVisible();
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
