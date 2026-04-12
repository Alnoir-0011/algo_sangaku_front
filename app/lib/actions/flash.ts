"use server";

import { cookies } from "next/headers";
export type FlashType = "success" | "info" | "error" | "warning";
export type Flash = {
  type: FlashType;
  message: string;
};

const VALID_FLASH_TYPES: FlashType[] = ["success", "info", "error", "warning"];

function isFlash(value: unknown): value is Flash {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    "message" in value &&
    VALID_FLASH_TYPES.includes((value as Flash).type) &&
    typeof (value as Flash).message === "string"
  );
}

export async function consumeFlash(): Promise<Flash | null> {
  try {
    const cookieStore = await cookies();
    const flashCookie = cookieStore.get("flash");

    if (!flashCookie) {
      return null;
    }

    cookieStore.delete("flash");
    const parsed: unknown = JSON.parse(flashCookie.value);
    if (!isFlash(parsed)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function setFlash(flash: Flash) {
  const cookieStore = await cookies();
  cookieStore.set("flash", JSON.stringify(flash), {
    path: "/",
    maxAge: 60,
    httpOnly: true,
    sameSite: "lax",
  });
}
