"use server";

import { auth } from "@/auth";
import type { Answer, AnswerResult } from "../definitions";
import { isRedirectError } from "next/dist/client/components/redirect-error";

const apiUrl = process.env.NEXT_PUBLIC_API_URL!;

export const fetchUserAnswer = async (id: string) => {
  const session = await auth();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session?.accessToken}`,
  };

  try {
    const res = await fetch(`${apiUrl}/api/v1/user/answers/${id}`, {
      headers,
    });

    switch (res.status) {
      case 200:
        const data = (await res.json()).data as Answer;
        return data;
      case 401:
        return undefined;
      case 404:
        return null;
    }
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    } else {
      return null;
    }
  }
};

export const fetchUserAnswerWithSangakuId = async (sangaku_id: string) => {
  const session = await auth();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session?.accessToken}`,
  };

  try {
    const res = await fetch(
      `${apiUrl}/api/v1/user/saved_sangakus/${sangaku_id}/answer`,
      {
        headers,
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
    }
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    } else {
      return null;
    }
  }
};

export const fetchUserAnswerResult = async (id: string) => {
  const session = await auth();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session?.accessToken}`,
  };

  try {
    while (true) {
      const res = await fetch(`${apiUrl}/api/v1/user/answer_results/${id}`, {
        headers,
        cache: "no-store",
      });

      switch (res.status) {
        case 200:
          const data = (await res.json()).data as AnswerResult;
          if (data.attributes.status !== "pending") {
            return data;
          } else {
            await new Promise((resolve) => setTimeout(resolve, 250));
          }
          break;
        case 401:
          return undefined;
        case 404:
          return null;
      }
    }
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    } else {
      return null;
    }
  }
};
