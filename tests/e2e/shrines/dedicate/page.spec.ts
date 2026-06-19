import { setSession } from "../../../__helpers__/signin";

import {
  test,
  expect,
  http,
  HttpResponse,
  passthrough,
} from "@/tests/e2e/fixtures.msw";

const apiUrl = process.env.API_URL;

test.describe("/shrines/[id]/dedicate", () => {
  test.use({
    geolocation: { latitude: 35.70204829610801, longitude: 139.76789333814216 },
    permissions: ["geolocation"],
  });

  test.use({
    mswHandlers: [
      [
        http.get(`${apiUrl}/api/v1/shrines/1`, () => {
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
        http.get(`${apiUrl}/api/v1/user/sangakus`, () => {
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
        http.post(`${apiUrl}/api/v1/user/sangakus/1/dedicate`, () => {
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
        }),
        http.get(`${apiUrl}/api/v1/shrines/999`, () => {
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

  test.describe("before signin", () => {
    test("should not allow me to access dedicate page without authentication", async ({
      page,
    }) => {
      await page.goto("/shrines/1/dedicate");
      await expect(page).toHaveURL("/signin");
      const flash = page.getByTestId("flash-message");
      await expect(flash).toBeVisible({ timeout: 10_000 });
      await expect(flash).toContainText("サインインしてください");
      await expect(
        page.locator("main").getByRole("heading", { name: "サインイン" }),
      ).toBeVisible();
    });

    test("should allow me to see sign in button in nav after page reload", async ({
      page,
    }) => {
      await page.goto("/shrines/1/dedicate");
      await expect(page).toHaveURL("/signin");
      await page.reload();
      await expect(
        page.locator("nav").getByRole("button", { name: "サインイン" }),
      ).toBeVisible();
    });
  });

  test.describe("after signin", () => {
    test("should allow me to dedicate own sangaku to shrine", async ({
      page,
    }) => {
      await setSession(page);

      await page.goto("/shrines/1/dedicate");
      const sangaku = page.getByRole("heading", { name: "before_dedicate" });
      await sangaku.click();
      const modal = page.getByRole("dialog");
      const heading = modal.getByRole("heading", { name: "before_dedicate" });
      await expect(heading).toBeVisible();
      const button = modal.getByRole("button", { name: "この算額を奉納する" });
      await button.click();
      await expect(page).toHaveURL("/shrines/1/dedicate");
      const flash = page.getByTestId("flash-message");
      await expect(flash).toBeVisible({ timeout: 10_000 });
      await expect(flash).toContainText("算額を奉納しました");
      const shareButton = page.getByRole("link", { name: "でシェア" });
      await expect(shareButton).toBeVisible();
    });

    test("should allow me to see not found page for a non-existent shrine", async ({
      page,
    }) => {
      await setSession(page);

      await page.goto("/shrines/999/dedicate");
      const message = page.getByRole("heading", {
        name: "This page could not be found.",
      });
      await expect(message).toBeVisible();
    });
  });
});
