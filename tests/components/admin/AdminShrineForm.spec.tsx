import { test, expect } from "@/tests/fixtures.ct";
import AdminShrineForm from "@/app/ui/admin/AdminShrineForm";

test.describe("AdminShrineForm (create mode)", () => {
  test("should have name input", async ({ mount }) => {
    const component = await mount(<AdminShrineForm />);
    await expect(component.getByLabel("神社名")).toBeVisible();
  });

  test("should have address input", async ({ mount }) => {
    const component = await mount(<AdminShrineForm />);
    await expect(component.getByLabel("住所")).toBeVisible();
  });

  test("should have latitude input", async ({ mount }) => {
    const component = await mount(<AdminShrineForm />);
    await expect(component.getByLabel("緯度")).toBeVisible();
  });

  test("should have longitude input", async ({ mount }) => {
    const component = await mount(<AdminShrineForm />);
    await expect(component.getByLabel("経度")).toBeVisible();
  });

  test("should have place_id input", async ({ mount }) => {
    const component = await mount(<AdminShrineForm />);
    await expect(component.getByLabel("Place ID")).toBeVisible();
  });

  test("should have submit button", async ({ mount }) => {
    const component = await mount(<AdminShrineForm />);
    await expect(component.getByRole("button", { name: "作成" })).toBeVisible();
  });
});

test.describe("AdminShrineForm (edit mode)", () => {
  const shrine = {
    id: "1",
    type: "shrine" as const,
    attributes: {
      name: "既存の神社",
      address: "東京都千代田区1-1",
      latitude: 35.681236,
      longitude: 139.767125,
      sangaku_count: 2,
    },
  };

  test("should pre-fill name with existing shrine data", async ({ mount }) => {
    const component = await mount(<AdminShrineForm shrine={shrine} />);
    await expect(component.getByLabel("神社名")).toHaveValue("既存の神社");
  });

  test("should have submit button labeled as update", async ({ mount }) => {
    const component = await mount(<AdminShrineForm shrine={shrine} />);
    await expect(component.getByRole("button", { name: "更新" })).toBeVisible();
  });
});
