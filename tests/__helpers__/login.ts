import { Browser, Page } from "@playwright/test";
import type { Session } from "next-auth";

export const setSession = async (browser: Browser, data: Session) => {
  const context = await browser.newContext();
  await context.addCookies([
    {
      name: "authjs.session-token",
      value: btoa(JSON.stringify(data)),
      domain: "localhost:4020",
      path: "/",
    },
  ]);

  const page = await context.newPage();
  return page;
};

export const mockClientSession = async (page: Page, json: Session | null) => {
  await page.route("http://localhost:3100/api/auth/session", async (route) => {
    await route.fulfill({ json });
  });
};
