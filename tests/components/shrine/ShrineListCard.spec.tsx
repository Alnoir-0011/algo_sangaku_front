import { test, expect } from "@/tests/fixtures.ct";
import ShrineListCard from "@/app/ui/shrine/ShrineListCard";
import type { Shrine } from "@/app/lib/definitions";

const baseShrine: Shrine = {
  id: "1",
  type: "shrine",
  attributes: {
    name: "テスト神社",
    address: "東京都千代田区1-1",
    latitude: 35.6809591,
    longitude: 139.7673068,
    place_id: "place123",
    sangaku_count: 10,
  },
};

test.describe("ShrineListCard (nearby)", () => {
  test("should allow me to see the shrine name and sangaku count", async ({
    mount,
  }) => {
    const component = await mount(
      <ShrineListCard shrine={baseShrine} isNearby />,
    );

    await expect(component.getByText("テスト神社")).toBeVisible();
    await expect(component.getByText("算額の数: 10")).toBeVisible();
  });

  test("should allow me to see 0 as the sangaku count when it is undefined", async ({
    mount,
  }) => {
    const shrine: Shrine = {
      ...baseShrine,
      attributes: { ...baseShrine.attributes, sangaku_count: undefined },
    };
    const component = await mount(<ShrineListCard shrine={shrine} isNearby />);

    await expect(component.getByText("算額の数: 0")).toBeVisible();
  });

  test("should allow me to navigate to the shrine's sangakus and dedicate pages", async ({
    mount,
  }) => {
    const component = await mount(
      <ShrineListCard shrine={baseShrine} isNearby />,
    );

    await expect(
      component.getByRole("link", { name: "算額を見る" }),
    ).toHaveAttribute("href", "/shrines/1/sangakus");
    await expect(
      component.getByRole("link", { name: "算額を奉納する" }),
    ).toHaveAttribute("href", "/shrines/1/dedicate");
  });
});

test.describe("ShrineListCard (not nearby)", () => {
  test("should allow me to see the sangaku count but not allow me to see the action links", async ({
    mount,
  }) => {
    const component = await mount(
      <ShrineListCard shrine={baseShrine} isNearby={false} />,
    );

    await expect(component.getByText("算額の数: 10")).toBeVisible();
    await expect(component.getByText("神社から離れています")).toBeVisible();
    await expect(
      component.getByRole("link", { name: "算額を見る" }),
    ).toHaveCount(0);
    await expect(
      component.getByRole("link", { name: "算額を奉納する" }),
    ).toHaveCount(0);
  });
});
