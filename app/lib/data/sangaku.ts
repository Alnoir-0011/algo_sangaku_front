"use server";

import { auth, signOut } from "@/auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import type { Sangaku } from "../definitions";
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export async function fetchUserSangakus(
  page: string,
  query: string,
): Promise<{ sangakus: Sangaku[]; totalPage: number; message?: string }> {
  const session = await auth();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session?.accessToken}`,
  };

  const params = new URLSearchParams();
  params.set("page", page);
  params.set("shrine_id", "");

  if (query) {
    params.set("title", query);
  }

  try {
    const res = await fetch(
      `${apiUrl}/api/v1/user/sangakus?${params.toString()}`,
      {
        headers,
      },
    );

    switch (res.status) {
      case 200:
        const totalPage = parseInt(res.headers.get("total-pages")!);
        const data = await res.json();
        const sangakus = data.data as Sangaku[];
        return { sangakus, totalPage };
      case 401:
        await signOut({ redirectTo: "/signin" });
      default:
        return {
          sangakus: [],
          totalPage: 0,
          message: "リクエストに失敗しました",
        };
    }
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    return {
      sangakus: [],
      totalPage: 0,
      message: "予期せぬエラーが発生しました",
    };
  }
}

export async function fetchUserSangaku(id: string) {
  const session = await auth();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session?.accessToken}`,
  };

  try {
    const res = await fetch(`${apiUrl}/api/v1/user/sangakus/${id}`, {
      headers,
    });

    switch (res.status) {
      case 200:
        const body = await res.json();
        return body.data as Sangaku;
      case 401:
        await signOut({ redirectTo: "/signin" });
      default:
        return null;
    }
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
  }
}
