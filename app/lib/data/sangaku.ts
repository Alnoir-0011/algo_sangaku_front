"use server";

import { auth } from "@/auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import type { Sangaku, SangakuResult, GenerateSourceUsage } from "../definitions";
import { isKind } from "../definitions";
import { serverFetch } from "@/app/lib/server-fetch";
import { apiUrl } from "@/app/lib/config";
import { isValidId } from "@/app/lib/validate-id";

// kind は Search.tsx の Select が選択肢を絞っているため通常は不正な値が来ないが、
// この関数群は "use server" 経由の直接呼び出しにも晒される。UI をバイパスした
// 呼び出しで back に任意の文字列を転送しないよう、isKind でホワイトリスト検証する
// （不正な値は絞り込みなしとして無視する）
function appendKindParam(params: URLSearchParams, kind?: string): void {
  if (kind && isKind(kind)) {
    params.set("kind", kind);
  }
}

export async function fetchUserSangakus(
  page: string,
  query: string,
  shrine_id: "" | "any" | number,
  kind?: string,
): Promise<{ sangakus: Sangaku[]; totalPage: number; message?: string }> {
  const session = await auth();

  const params = new URLSearchParams();
  params.set("page", page);
  params.set("shrine_id", String(shrine_id));

  if (query) {
    params.set("title", query);
  }

  appendKindParam(params, kind);

  try {
    const res = await serverFetch(
      `${apiUrl}/api/v1/user/sangakus?${params.toString()}`,
      { token: session?.accessToken },
    );

    switch (res.status) {
      case 200:
        const totalPage = Number(res.headers.get("total-pages"));
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
      console.error("[data/sangaku] fetchUserSangakus error:", error);
      return {
        sangakus: [],
        totalPage: 0,
        message: "予期せぬエラーが発生しました",
      };
    }
  }
}

export async function fetchUserSangaku(id: string) {
  // id はクライアントが完全に制御できる値のため、URL に補間する前に検証する
  // （不正な値をそのまま補間するとパストラバーサルにつながりうる）
  if (!isValidId(id)) {
    return null;
  }

  const session = await auth();

  try {
    const res = await serverFetch(
      `${apiUrl}/api/v1/user/sangakus/${encodeURIComponent(id)}`,
      { token: session?.accessToken },
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
    } else {
      console.error("[data/sangaku] fetchUserSangaku error:", error);
      return null;
    }
  }
}

// 他の fetch 関数と異なり、404 のみ null を返し、それ以外の異常は throw する。
// 5xx やネットワーク異常を null にすると、呼び出し側が「要サインイン」と誤認するため。
export async function fetchPublicReorderSangaku(
  id: string,
): Promise<Sangaku | null> {
  if (!isValidId(id)) {
    return null;
  }

  const res = await serverFetch(
    `${apiUrl}/api/v1/public/reorder_sangakus/${encodeURIComponent(id)}`,
  );

  switch (res.status) {
    case 200:
      return (await res.json()).data as Sangaku;
    case 404:
      return null;
    default:
      throw new Error(
        `fetchPublicReorderSangaku failed with status ${res.status}`,
      );
  }
}

// 神社ページ上の導線用の補助機能なので、あらゆる失敗（非200・ネットワーク異常）を null に倒す。
// 取得できなくても画面全体は成立させたいため、fetchPublicReorderSangaku とは意図的に挙動を分けている。
export async function fetchRepresentativeReorderSangaku(
  shrineId: string,
): Promise<Sangaku | null> {
  if (!isValidId(shrineId)) {
    return null;
  }

  try {
    const res = await serverFetch(
      `${apiUrl}/api/v1/public/shrines/${encodeURIComponent(shrineId)}/representative_reorder_sangaku`,
    );

    if (res.status === 200) {
      return (await res.json()).data as Sangaku;
    }

    return null;
  } catch {
    return null;
  }
}

export async function fetchShrineSangakus(
  shrine_id: string,
  page: string,
  query: string,
  difficulty: string,
  kind?: string,
): Promise<{ sangakus: Sangaku[]; totalPage: number; message?: string }> {
  // shrine_id はクライアントが完全に制御できる値のため、URL に補間する前に検証する
  if (!isValidId(shrine_id)) {
    return {
      sangakus: [] as Sangaku[],
      totalPage: 0,
      message: "リクエストに失敗しました",
    };
  }

  try {
    const params = new URLSearchParams({ page, title: query, difficulty });

    appendKindParam(params, kind);

    const res = await serverFetch(
      `${apiUrl}/api/v1/shrines/${encodeURIComponent(shrine_id)}/sangakus?${params}`,
    );

    if (res.status === 200) {
      const data = await res.json();
      const sangakus = data.data as Sangaku[];
      const totalPage = Number(res.headers.get("total-pages"));
      return { sangakus, totalPage };
    } else {
      return {
        sangakus: [] as Sangaku[],
        totalPage: 0,
        message: "リクエストに失敗しました",
      };
    }
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    } else {
      console.error("[data/sangaku] fetchShrineSangakus error:", error);
      return {
        sangakus: [] as Sangaku[],
        totalPage: 0,
        message: "予期せぬエラーが発生しました",
      };
    }
  }
}

export async function fetchSavedSangakuIds(
  sangaku_ids: string[],
): Promise<Set<string>> {
  if (sangaku_ids.length === 0) {
    return new Set();
  }

  const session = await auth();
  if (!session?.accessToken) {
    return new Set();
  }

  try {
    const params = new URLSearchParams();
    sangaku_ids.forEach((id) => params.append("sangaku_ids[]", id));

    const res = await serverFetch(
      `${apiUrl}/api/v1/user/saved_sangaku_ids?${params}`,
      { token: session.accessToken },
    );

    if (res.status !== 200) {
      return new Set();
    }

    const body = await res.json();
    const savedIds = body.saved_sangaku_ids as number[];
    return new Set(savedIds.map(String));
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error("[data/sangaku] fetchSavedSangakuIds error:", error);
    return new Set();
  }
}

export async function fetchSavedSangakus(
  page: string,
  query: string,
  difficulty: string,
  type?: "before_answer" | "answered",
  kind?: string,
): Promise<{ sangakus: Sangaku[]; totalPage: number; message?: string }> {
  const session = await auth();

  try {
    const params = new URLSearchParams({ page, title: query, difficulty });

    if (type) {
      params.set("type", type);
    }

    appendKindParam(params, kind);

    const res = await serverFetch(`${apiUrl}/api/v1/user/saved_sangakus?${params}`, {
      token: session?.accessToken,
    });

    switch (res.status) {
      case 200:
        const data = await res.json();
        const sangakus = data.data as Sangaku[];
        const totalPage = Number(res.headers.get("total-pages"));
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
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    } else {
      console.error("[data/sangaku] fetchSavedSangakus error:", error);
      return {
        sangakus: [] as Sangaku[],
        totalPage: 0,
        message: "予期せぬエラーが発生しました",
      };
    }
  }
}

export async function fetchSavedSangaku(
  id: string,
  type?: "before_answer" | "answered",
) {
  // id はクライアントが完全に制御できる値のため、URL に補間する前に検証する
  if (!isValidId(id)) {
    return null;
  }

  const session = await auth();

  try {
    const params = new URLSearchParams();
    if (type) {
      params.set("type", type);
    }

    const res = await serverFetch(
      `${apiUrl}/api/v1/user/saved_sangakus/${encodeURIComponent(id)}?${params}`,
      { token: session?.accessToken },
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
    } else {
      console.error("[data/sangaku] fetchSavedSangaku error:", error);
      return null;
    }
  }
}

export async function fetchGenerateSourceUsage(): Promise<
  GenerateSourceUsage | undefined
> {
  const session = await auth();

  try {
    // AI コード生成の利用状況取得もコード問題専用の機能のため、作成・更新・生成と同様に
    // code_sangakus エンドポイントを使う（エンドポイントの使い分けの理由は
    // app/lib/actions/sangaku.ts の createSangaku 内のコメント参照）
    const res = await serverFetch(
      `${apiUrl}/api/v1/user/code_sangakus/generate_source_usage`,
      { token: session?.accessToken },
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
      console.error("[data/sangaku] fetchGenerateSourceUsage error:", error);
      return undefined;
    }
  }
}

export async function fetchUserSangakuResult(id: string) {
  // id はクライアントが完全に制御できる値のため、URL に補間する前に検証する
  if (!isValidId(id)) {
    return null;
  }

  const session = await auth();

  try {
    const res = await serverFetch(
      `${apiUrl}/api/v1/user/sangakus/${encodeURIComponent(id)}/result`,
      { token: session?.accessToken },
    );

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
    } else {
      console.error("[data/sangaku] fetchUserSangakuResult error:", error);
      return null;
    }
  }
}
