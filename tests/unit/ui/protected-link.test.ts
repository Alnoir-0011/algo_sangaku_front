import { describe, test, expect, vi, beforeEach } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const sessionState = vi.hoisted(() => ({
  status: "unauthenticated" as "loading" | "authenticated" | "unauthenticated",
}));

vi.mock("next-auth/react", () => ({
  useSession: () => ({ status: sessionState.status }),
}));

vi.mock("@/app/ui/shared/NextLink", () => ({
  default: ({ href, prefetch }: { href: string; prefetch?: boolean | null }) =>
    createElement("a", {
      href,
      "data-prefetch": prefetch === undefined ? "default" : String(prefetch),
    }),
}));

import ProtectedLink from "@/app/ui/shared/ProtectedLink";

const render = (props: { prefetch?: boolean | null } = {}) =>
  renderToStaticMarkup(
    createElement(ProtectedLink, { href: "/sangakus/create", ...props }),
  );

describe("ProtectedLink", () => {
  beforeEach(() => {
    sessionState.status = "unauthenticated";
  });

  test("should not allow prefetching while I am signed out", () => {
    sessionState.status = "unauthenticated";

    expect(render()).toContain('data-prefetch="false"');
  });

  test("should not allow prefetching while my session is loading", () => {
    sessionState.status = "loading";

    expect(render()).toContain('data-prefetch="false"');
  });

  test("should not allow prefetching while I am signed out even if prefetch is requested", () => {
    sessionState.status = "unauthenticated";

    expect(render({ prefetch: true })).toContain('data-prefetch="false"');
  });

  test("should allow prefetching with the default behavior after I sign in", () => {
    sessionState.status = "authenticated";

    expect(render()).toContain('data-prefetch="default"');
  });

  test("should allow prefetching to be requested after I sign in", () => {
    sessionState.status = "authenticated";

    expect(render({ prefetch: true })).toContain('data-prefetch="true"');
  });

  test("should not allow prefetching after I sign in when prefetch is turned off", () => {
    sessionState.status = "authenticated";

    expect(render({ prefetch: false })).toContain('data-prefetch="false"');
  });

  test("should pass the href through", () => {
    expect(render()).toContain('href="/sangakus/create"');
  });
});
