import { test, expect } from "@playwright/experimental-ct-react";
import {
  SourceResultLoading,
  ResultLoading,
} from "@/app/ui/answer/LoadingCirclars";

test.describe("SourceResultLoading", () => {
  test("renders loading indicator", async ({ mount, page }) => {
    await mount(<SourceResultLoading />);
    await expect(
      page.locator(".MuiCircularProgress-root"),
    ).toBeVisible();
  });
});

test.describe("ResultLoading", () => {
  test("renders loading indicator with index", async ({ mount }) => {
    const component = await mount(<ResultLoading index={0} />);
    await expect(component.getByText("1")).toBeVisible();
  });

  test("renders correct index number", async ({ mount }) => {
    const component = await mount(<ResultLoading index={2} />);
    await expect(component.getByText("3")).toBeVisible();
  });
});
