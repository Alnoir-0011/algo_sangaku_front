// import { setSession } from "../../../__helpers__/signin";

import {
  test,
  expect,
  http,
  HttpResponse,
  passthrough,
} from "next/experimental/testmode/playwright/msw";

test.describe("/shrines/[id]/sangakus", () => {
  test.use({
    geolocation: { latitude: 35.70204829610801, longitude: 139.76789333814216 },
    permissions: ["geolocation"],
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
        http.get("http://localhost:3000/api/v1/shrines/999", () => {
          return new HttpResponse({}, { status: 404 });
        }),
        http.get("http://localhost:3000/api/v1/shrines/1/sangakus", () => {
          return HttpResponse.json({
            data: [
              {
                id: "1",
                type: "sangaku",
                attributes: {
                  title: "test_title",
                  description: "test_description",
                  source: "put 'Hello world'",
                  difficulty: "nomal",
                  inputs: [],
                },
                relationships: {
                  user: {
                    data: {
                      id: "2",
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
            ],
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
    test("should allow me to visit page", async ({ page }) => {
      await page.goto("/shrines/1/sangakus");
      const heading = page.getByRole("heading", {
        name: "test_shrineの算額一覧",
      });
      await expect(heading).toBeVisible();
      const sangakuTitle = page.getByRole("heading", {
        name: "test_title",
      });
      await expect(sangakuTitle).toBeVisible();
    });

    test.skip("should not allow me to create sangakuCopy", () => {});

    test("should display notFound page", async ({ page }) => {
      await page.goto("/shrines/999/sangakus");
      const message = page.getByRole("heading", {
        name: "This page could not be found.",
      });
      await expect(message).toBeVisible();
    });
  });
});
