import { test, expect } from "@playwright/experimental-ct-react";
import {
  SangakuListSkeleton,
  SangakuWithButtonListSkeleton,
  MapSkeleton,
} from "@/app/ui/skeletons";

test.describe("SangakuListSkeleton", () => {
  test("renders 9 skeleton items", async ({ mount, page }) => {
    await mount(<SangakuListSkeleton />);
    const skeletons = page.locator(".MuiSkeleton-root");
    await expect(skeletons).toHaveCount(9);
  });
});

test.describe("SangakuWithButtonListSkeleton", () => {
  test("renders skeleton items with button skeletons", async ({
    mount,
    page,
  }) => {
    await mount(<SangakuWithButtonListSkeleton width={100} />);
    // 9 cards * 2 skeletons (card + button) = 18
    const skeletons = page.locator(".MuiSkeleton-root");
    await expect(skeletons).toHaveCount(18);
  });
});

test.describe("MapSkeleton", () => {
  test("renders map skeleton", async ({ mount, page }) => {
    await mount(<MapSkeleton />);
    const skeletons = page.locator(".MuiSkeleton-root");
    await expect(skeletons).toHaveCount(2);
  });
});
