import { Page } from "@playwright/test";
import type { Session } from "next-auth";

export const setSession = async (page: Page) => {
  await page.goto("/");
  await page.getByRole("button", { name: "サインイン" }).click();
  await page.getByLabel("Email").fill("test_user@example.com");
  await page.getByLabel("Password").fill("password");
  await page.getByRole("button", { name: "Sign in with Credentials" }).click();
};

export const mockClientSession = async (page: Page, json: Session | null) => {
  await page.route("http://localhost:3100/api/auth/session", async (route) => {
    await route.fulfill({ json });
  });
};
