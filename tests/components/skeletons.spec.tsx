import { test, expect } from "@/tests/fixtures.ct";
import {
  SangakuListSkeleton,
  SangakuWithButtonListSkeleton,
  MapSkeleton,
} from "@/app/ui/skeletons";

test.describe("SangakuListSkeleton", () => {
  test("should allow me to see 9 skeleton items", async ({ mount, page }) => {
    await mount(<SangakuListSkeleton />);
    const skeletons = page.getByTestId("skeleton-item");
    await expect(skeletons).toHaveCount(9);
  });
});

test.describe("SangakuWithButtonListSkeleton", () => {
  test("should allow me to see skeleton items with button skeletons", async ({
    mount,
    page,
  }) => {
    await mount(<SangakuWithButtonListSkeleton width={100} />);
    // 9 cards * 2 skeletons (card + button) = 18
    const skeletons = page.getByTestId("skeleton-item");
    await expect(skeletons).toHaveCount(18);
  });
});

test.describe("MapSkeleton", () => {
  test("should allow me to see map skeleton", async ({ mount, page }) => {
    await mount(<MapSkeleton />);
    const skeletons = page.getByTestId("skeleton-item");
    await expect(skeletons).toHaveCount(2);
  });
});
