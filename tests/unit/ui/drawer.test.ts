import { describe, test, expect, vi } from "vitest";
import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/app/lib/auth-client", () => ({
  authClient: { useSession: () => ({ data: { user: {} }, isPending: false }) },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/app/lib/actions/auth", () => ({ customSignOut: vi.fn() }));

vi.mock("@/app/ui/shared/NextLink", () => ({
  default: ({
    href,
    prefetch,
    children,
  }: {
    href: string;
    prefetch?: boolean | null;
    children?: ReactNode;
  }) =>
    createElement(
      "a",
      {
        href,
        "data-prefetch": prefetch === undefined ? "default" : String(prefetch),
      },
      children,
    ),
}));

import ResponsiveDrawer from "@/app/ui/navigation/Drawer";
import { isPublicPath } from "@/routes";

const html = renderToStaticMarkup(
  createElement(ResponsiveDrawer, {
    drawerWidth: 240,
    mobileOpen: true,
    handleDrawerTransitionEnd: () => {},
    handleDrawerClose: () => {},
  }),
);

const anchors = [
  ...html.matchAll(/<a href="([^"]*)" data-prefetch="([^"]*)"/g),
].map((match) => ({ href: match[1], prefetch: match[2] }));

const protectedAnchors = anchors.filter(({ href }) => !isPublicPath(href));
const publicAnchors = anchors.filter(({ href }) => isPublicPath(href));

// サインイン後の Drawer
describe("Drawer after I sign in", () => {
  // 保護されたリンクと公開リンクの両方を描画する
  test("should render both protected and public links", () => {
    expect(protectedAnchors.length).toBeGreaterThan(0);
    expect(publicAnchors.length).toBeGreaterThan(0);
  });

  // 保護されたリンクのプリフェッチを許可しない
  test("should not allow prefetching any protected link", () => {
    expect(
      protectedAnchors.filter(({ prefetch }) => prefetch !== "false"),
    ).toEqual([]);
  });

  // 公開リンクはデフォルトの挙動でプリフェッチできる
  test("should allow prefetching public links with the default behavior", () => {
    expect(
      publicAnchors.filter(({ prefetch }) => prefetch !== "default"),
    ).toEqual([]);
  });
});
