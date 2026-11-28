import { describe, test, expect, vi } from "vitest";

// beforeEach では設定しない。auth.ts は import の時点で、環境変数から設定を作るため
vi.hoisted(() => {
  process.env.BETTER_AUTH_SECRET = "test-secret-for-provider-map-012345678";
  process.env.BETTER_AUTH_URL = "http://localhost:4020";
  process.env.AUTH_GOOGLE_ID = "google-client-id";
  process.env.AUTH_GOOGLE_SECRET = "google-client-secret";
  process.env.API_URL = "http://api.test";
});

vi.mock("@/app/lib/server-fetch", () => ({ serverFetch: vi.fn() }));
vi.mock("@/app/lib/set-flash", () => ({ setFlash: vi.fn() }));

import { getProviderMap } from "@/auth";

describe("provider map for the sign-in page", () => {
  test("should allow me to see the sign-in button of each provider that is set up", async () => {
    expect(await getProviderMap()).toEqual([{ id: "google", name: "Google" }]);
  });

  test("should not allow the secrets of a provider to be passed to the sign-in page", async () => {
    const [provider] = await getProviderMap();

    expect(Object.keys(provider).sort()).toEqual(["id", "name"]);
  });
});
