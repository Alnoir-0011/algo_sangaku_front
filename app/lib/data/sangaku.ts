"use server";

import { auth } from "@/auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import type {
  Sangaku,
  SangakuResult,
  GenerateSourceUsage,
} from "../definitions";
import { buildHeaders } from "@/app/lib/client_headers";
const apiUrl = process.env.API_URL;

export async function fetchUserSangakus(
  page: string,
  query: string,
  shrine_id: "" | "any" | number,
): Promise<{ sangakus: Sangaku[]; totalPage: number; message?: string }> {
  const session = await auth();

  const params = new URLSearchParams();
  params.set("page", page);

  if (typeof shrine_id === "number") {
    params.set("shrine_id", String(shrine_id));
  } else {
    params.set("shrine_id", shrine_id);
  }

  if (query) {
    params.set("title", query);
  }

  try {
    const res = await fetch(
      `${apiUrl}/api/v1/user/sangakus?${params.toString()}`,
      {
        headers: buildHeaders(session?.accessToken),
      },
    );

    switch (res.status) {
      case 200:
        const totalPage = parseInt(res.headers.get("total-pages")!);
        const data = await res.json();
        const sangakus = data.data as Sangaku[];
        return { sangakus, totalPage };
      case 401:
        return {
          sangakus: [],
          totalPage: 0,
          message:
            "セッションの有効期限が切れています。再度サインインしてください。 ",
        };
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
    } else {
      return {
        sangakus: [],
        totalPage: 0,
        message: "予期せぬエラーが発生しました",
      };
    }
  }
}

export async function fetchUserSangaku(id: string) {
  const session = await auth();

  try {
    const res = await fetch(`${apiUrl}/api/v1/user/sangakus/${id}`, {
      headers: buildHeaders(session?.accessToken),
    });

    switch (res.status) {
      case 200:
        const body = await res.json();
        return body.data as Sangaku;
      case 401:
        return undefined;
      default:
        return null;
    }
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    } else {
      return null;
    }
  }
}

export async function fetchShrineSangakus(
  shrine_id: string,
  page: string,
  query: string,
  difficulty: string,
): Promise<{ sangakus: Sangaku[]; totalPage: number; message?: string }> {
  try {
    const params = new URLSearchParams({ page, title: query, difficulty });

    const res = await fetch(
      `${apiUrl}/api/v1/shrines/${shrine_id}/sangakus?${params}`,
      {
        headers: buildHeaders(),
      },
    );

    if (res.status === 200) {
      const data = await res.json();
      const sangakus = data.data as Sangaku[];
      const totalPage = parseInt(res.headers.get("total-pages")!);
      return { sangakus, totalPage };
    } else {
      return {
        sangakus: [] as Sangaku[],
        totalPage: 0,
        message: "リクエストに失敗しました",
      };
    }
  } catch {
    return {
      sangakus: [] as Sangaku[],
      totalPage: 0,
      message: "予期せぬエラーが発生しました",
    };
  }
}

export async function fetchSavedSangakus(
  page: string,
  query: string,
  difficulty: string,
  type?: "before_answer" | "answered",
): Promise<{ sangakus: Sangaku[]; totalPage: number; message?: string }> {
  const session = await auth();

  try {
    const params = new URLSearchParams({ page, title: query, difficulty });

    if (type) {
      params.set("type", type);
    }

    const res = await fetch(`${apiUrl}/api/v1/user/saved_sangakus?${params}`, {
      headers: buildHeaders(session?.accessToken),
    });

    switch (res.status) {
      case 200:
        const data = await res.json();
        const sangakus = data.data as Sangaku[];
        const totalPage = parseInt(res.headers.get("total-pages")!);
        return { sangakus, totalPage };
      case 401:
        return {
          sangakus: [] as Sangaku[],
          totalPage: 0,
          message:
            "セッションの有効期限が切れています。再度サインインしてください。",
        };
      default:
        return {
          sangakus: [] as Sangaku[],
          totalPage: 0,
          message: "リクエストに失敗しました",
        };
    }
  } catch {
    return {
      sangakus: [] as Sangaku[],
      totalPage: 0,
      message: "予期せぬエラーが発生しました",
    };
  }
}

export async function fetchSavedSangaku(
  id: string,
  type?: "before_answer" | "answered",
) {
  const session = await auth();

  try {
    const params = new URLSearchParams();
    if (type) {
      params.set("type", type);
    }

    const res = await fetch(
      `${apiUrl}/api/v1/user/saved_sangakus/${id}?${params}`,
      {
        headers: buildHeaders(session?.accessToken),
      },
    );

    switch (res.status) {
      case 200:
        const body = await res.json();
        return body.data as Sangaku;
      case 401:
        return undefined;
      default:
        return null;
    }
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
  }
}

export async function fetchGenerateSourceUsage(): Promise<
  GenerateSourceUsage | undefined
> {
  const session = await auth();

  try {
    const res = await fetch(
      `${apiUrl}/api/v1/user/sangakus/generate_source_usage`,
      { headers: buildHeaders(session?.accessToken) },
    );

    switch (res.status) {
      case 200:
        const body = await res.json();
        return body as GenerateSourceUsage;
      case 401:
        return undefined;
      default:
        return undefined;
    }
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    } else {
      return undefined;
    }
  }
}

export async function fetchUserSangakuResult(id: string) {
  const session = await auth();

  try {
    const res = await fetch(`${apiUrl}/api/v1/user/sangakus/${id}/result`, {
      headers: buildHeaders(session?.accessToken),
    });

    switch (res.status) {
      case 200:
        const body = await res.json();
        return body.data as SangakuResult;
      case 401:
        return undefined;
      default:
        return null;
    }
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
  }
}
