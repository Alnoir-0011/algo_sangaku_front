"use server";

import { auth } from "@/auth";
import type { Answer } from "../definitions";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { buildHeaders } from "@/app/lib/client_headers";
import { apiUrl } from "@/app/lib/config";

export const fetchUserAnswer = async (id: string) => {
  const session = await auth();

  try {
    const res = await fetch(`${apiUrl}/api/v1/user/answers/${id}`, {
      headers: buildHeaders(session?.accessToken),
    });

    switch (res.status) {
      case 200:
        const data = (await res.json()).data as Answer;
        return data;
      case 401:
        return undefined;
      case 404:
        return null;
      default:
        return null;
    }
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    } else {
      console.error("[data/answer] fetchUserAnswer error:", error);
      return null;
    }
  }
};

export const fetchUserAnswerWithSangakuId = async (sangakuId: string) => {
  const session = await auth();

  try {
    const res = await fetch(
      `${apiUrl}/api/v1/user/saved_sangakus/${sangakuId}/answer`,
      {
        headers: buildHeaders(session?.accessToken),
      },
    );

    switch (res.status) {
      case 200:
        const data = await res.json();
        return data.data as Answer;
      case 401:
        return undefined;
      case 404:
        return null;
      default:
        return null;
    }
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    } else {
      console.error("[data/answer] fetchUserAnswerWithSangakuId error:", error);
      return null;
    }
  }
};
