import { setSession } from "../../../__helpers__/signin";

import {
  test,
  expect,
  http,
  HttpResponse,
  passthrough,
} from "next/experimental/testmode/playwright/msw";

test.describe("/shrines/[id]/dedicate", () => {
  test.use({
    geolocation: { latitude: 35.70204829610801, longitude: 139.76789333814216 },
    permissions: ["geolocation"],
  });

  test.describe("before login", () => {
    test("redirect to signin page", async ({ page }) => {
      page.goto("/shrines/1/dedicate");
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

  test.use({
    mswHandlers: [
      [
        http.get("http://localhost:3000/api/v1/shrines/1", () => {
          return HttpResponse.json(
            {
              data: {
                id: "1",
                type: "shrine",
                attributes: {
                  name: "test_shrine",
                  address: "test_address",
                  latitude: 35.70204829610801,
                  longitude: 139.76789333814216,
                  place_id: "test_place_id_1",
                },
              },
            },
            { status: 200 },
          );
        }),
        http.get("http://localhost:3000/api/v1/user/sangakus", () => {
          return HttpResponse.json(
            {
              data: [
                {
                  id: "1",
                  type: "sangaku",
                  attributes: {
                    title: "before_dedicate",
                    description: "test_description",
                    source: "puts 'Hello world'",
                    difficulty: "easy",
                    inputs: [
                      {
                        id: "1",
                        content: "test_input_1",
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
            },
            { status: 200 },
          );
        }),
        http.post(
          "http://localhost:3000/api/v1/user/sangakus/1/dedicate",
          () => {
            return HttpResponse.json({
              data: {
                id: "1",
                type: "sangaku",
                attributes: {
                  title: "before_dedicate",
                  description: "test_description",
                  source: "puts 'Hello world'",
                  difficulty: "easy",
                  inputs: [
                    {
                      id: "1",
                      content: "test_input_1",
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
                    data: {
                      id: "1",
                      type: "shrine",
                    },
                  },
                },
              },
            });
          },
        ),
        http.get("http://localhost:3000/api/v1/shrines/999", () => {
          return new HttpResponse({}, { status: 404 });
        }),
        // allow all non-mocked routes to pass through
        http.all("*", () => {
          return passthrough();
        }),
      ],
      { scope: "test" }, // or 'worker'
    ],
  });
  test.describe("after login", () => {
    test("should allow me to dedicate own sangaku to shrine", async ({
      page,
    }) => {
      await setSession(page);

      page.goto("/shrines/1/dedicate");
      page.waitForLoadState();
      const sangaku = page.getByRole("heading", { name: "before_dedicate" });
      await sangaku.click();
      const modal = page.getByLabel("confirm-modal");
      const heading = modal.getByRole("heading", { name: "before_dedicate" });
      await expect(heading).toBeVisible();
      const button = modal.getByRole("button", { name: "この算額を奉納する" });
      await button.click();
      await expect(page).toHaveURL("/shrines");
      const flash = page.getByText("算額を奉納しました");
      await expect(flash).toBeVisible();
    });

    test("should display notFound page", async ({ page }) => {
      await setSession(page);

      page.goto("/shrines/999/dedicate");
      const message = page.getByRole("heading", {
        name: "This page could not be found.",
      });
      await expect(message).toBeVisible();
    });
  });
});
