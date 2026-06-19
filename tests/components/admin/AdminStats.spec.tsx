import { test, expect } from "@/tests/fixtures.ct";
import AdminStats from "@/app/ui/admin/AdminStats";

const stats = {
  users_count: 10,
  sangakus_count: 5,
  shrines_count: 3,
  answers_count: 20,
};

test.describe("AdminStats", () => {
  test("should allow me to see users count", async ({ mount }) => {
    const component = await mount(<AdminStats stats={stats} />);
    await expect(component.getByTestId("users_count").getByText("10")).toBeVisible();
  });

  test("should allow me to see sangakus count", async ({ mount }) => {
    const component = await mount(<AdminStats stats={stats} />);
    await expect(component.getByTestId("sangakus_count").getByText("5")).toBeVisible();
  });

  test("should allow me to see shrines count", async ({ mount }) => {
    const component = await mount(<AdminStats stats={stats} />);
    await expect(component.getByTestId("shrines_count").getByText("3")).toBeVisible();
  });

  test("should allow me to see answers count", async ({ mount }) => {
    const component = await mount(<AdminStats stats={stats} />);
    await expect(component.getByTestId("answers_count").getByText("20")).toBeVisible();
  });
});
