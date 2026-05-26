import { test, expect } from "@playwright/experimental-ct-react";
import AdminStats from "@/app/ui/admin/AdminStats";

const stats = {
  users_count: 10,
  sangakus_count: 5,
  shrines_count: 3,
  answers_count: 20,
};

test.describe("AdminStats", () => {
  test("should display users count", async ({ mount }) => {
    const component = await mount(<AdminStats stats={stats} />);
    await expect(component.getByText("10")).toBeVisible();
  });

  test("should display sangakus count", async ({ mount }) => {
    const component = await mount(<AdminStats stats={stats} />);
    await expect(component.getByText("5")).toBeVisible();
  });

  test("should display shrines count", async ({ mount }) => {
    const component = await mount(<AdminStats stats={stats} />);
    await expect(component.getByText("3")).toBeVisible();
  });

  test("should display answers count", async ({ mount }) => {
    const component = await mount(<AdminStats stats={stats} />);
    await expect(component.getByText("20")).toBeVisible();
  });
});
