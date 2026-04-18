"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";
import { setFlash } from "@/app/lib/actions/flash";
import { Difficulty, GenerateSourceUsage } from "../definitions";
import { customSignOut } from "./auth";
import { buildHeaders } from "@/app/lib/client_headers";

const apiUrl = process.env.API_URL!;

export type State = {
  errors?: {
    title?: string[];
    description?: string[];
    source?: string[];
    fixed_inputs?: string[];
  };
  values?: {
    title?: string;
    description?: string;
  };
  message?: string;
};

export const createSangaku = async (
  _prevState: State,
  formData: FormData,
  source: string,
  difficulty: Difficulty,
  fixed_inputs: string[],
  description: string,
) => {
  const session = await auth();
  const title = formData.get("title");

  const params = {
    sangaku: {
      title,
      description,
      source,
      difficulty,
    },
    fixed_inputs,
  };

  try {
    const res = await fetch(`${apiUrl}/api/v1/user/sangakus`, {
      method: "POST",
      headers: buildHeaders(session?.accessToken),
      body: JSON.stringify(params),
    });

    switch (res.status) {
      case 200:
        await setFlash({ type: "success", message: "算額を作成しました" });
        revalidatePath("/user/sangakus");
        redirect("/");
      case 401:
        await setFlash({
          type: "error",
          message:
            "セッションの有効期限が切れています。\n再度サインインしてください",
        });
        await customSignOut();
        return {} as State;
      case 400:
        const data = await res.json();
        await setFlash({ type: "error", message: "入力に誤りがあります" });
        return {
          errors: Object.fromEntries(data.errors),
          // message: "入力に誤りがあります",
          values: { title, description },
        } as State;
      default:
        await setFlash({ type: "error", message: "リクエストに失敗しました" });
        return {
          // message: "リクエストに失敗しました",
          values: { title, description },
        } as State;
    }
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    await setFlash({ type: "error", message: "予期せぬエラーが発生しました" });
    return {
      // message: "予期せぬエラーが発生しました",
      values: { title, description },
    } as State;
  }
};

export const updateSangaku = async (
  id: string,
  _prevState: State,
  formData: FormData,
  source: string,
  difficulty: Difficulty,
  fixed_inputs: string[],
  description: string,
) => {
  const session = await auth();

  const title = formData.get("title");

  const params = {
    sangaku: {
      title,
      description,
      source,
      difficulty,
    },
    fixed_inputs,
  };

  try {
    const res = await fetch(`${apiUrl}/api/v1/user/sangakus/${id}`, {
      method: "PATCH",
      headers: buildHeaders(session?.accessToken),
      body: JSON.stringify(params),
    });

    switch (res.status) {
      case 200:
        await setFlash({ type: "success", message: "算額を更新しました" });
        revalidatePath("/user/sangakus");
        redirect("/user/sangakus");
      case 401:
        await setFlash({
          type: "error",
          message:
            "セッションの有効期限が切れています。\n再度サインインしてください",
        });
        await customSignOut();
        return {} as State;
      case 400:
        const data = await res.json();
        await setFlash({ type: "error", message: "入力に誤りがあります" });
        return {
          errors: Object.fromEntries(data.errors),
          // message: "入力に誤りがあります",
          values: { title, description },
        } as State;
      default:
        await setFlash({ type: "error", message: "リクエストに失敗しました" });
        return {
          // message: "リクエストに失敗しました",
          values: { title, description },
        } as State;
    }
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    await setFlash({ type: "error", message: "予期せぬエラーが発生しました" });
    return {
      // message: "予期せぬエラーが発生しました",
      values: { title, description },
    } as State;
  }
};

export const deleteSangaku = async (id: string) => {
  const session = await auth();

  try {
    const res = await fetch(`${apiUrl}/api/v1/user/sangakus/${id}`, {
      method: "DELETE",
      headers: buildHeaders(session?.accessToken),
    });

    switch (res.status) {
      case 200:
        await setFlash({ type: "success", message: "算額を削除しました" });
        redirect("/user/sangakus");
      case 401:
        await setFlash({
          type: "error",
          message:
            "セッションの有効期限が切れています。\n再度サインインしてください",
        });
        await customSignOut();
        break;
      default:
    }
  } catch (e) {
    if (isRedirectError(e)) {
      throw e;
    }
  }
};

export const runSource = async (source: string, fixedInputs: string[]) => {
  if (!fixedInputs.length) {
    fixedInputs.push("");
  }
  const results = await Promise.all(
    fixedInputs.map(async (input) => {
      try {
        const id = await postSource(source, input, "ruby");
        let isSourceComplete = false;
        while (isSourceComplete === false) {
          await sleep(200);
          isSourceComplete = await getStatus(id);
        }
        const result = await getDetails(id);

        if (result.build_stderr) {
          return result.build_stderr;
        }

        if (result.build_stdout) {
          return result.build_stdout;
        }

        if (result.stderr) {
          return result.stderr;
        }
        return result.stdout;
      } catch {
        return "コードを実行できませんでした";
      }
    }),
  );
  return results;
};

const sleep = (time: number) =>
  new Promise((resolve) => setTimeout(resolve, time)); //timeはミリ秒

const postSource = async (source: string, input: string, language: string) => {
  const params = new URLSearchParams({
    api_key: "guest",
    source_code: source,
    input,
    language,
  });
  const reqUri = `https://api.paiza.io:443/runners/create.json?${params}`;
  try {
    const res = await fetch(reqUri, { method: "POST" });
    switch (res.status) {
      case 200:
        const data = await res.json();
        return data.id as string;
      default:
        throw Error;
    }
  } catch (error) {
    console.error(error);
    throw Error("request fail");
  }
};

const getStatus = async (id: string) => {
  const params = new URLSearchParams({
    api_key: "guest",
    id,
  });
  const reqUri = `https://api.paiza.io:443/runners/get_status.json?${params}`;
  try {
    const res = await fetch(reqUri);
    switch (res.status) {
      case 200:
        const data = await res.json();
        return data.status === "completed";
      default:
        throw Error;
    }
  } catch (error) {
    console.error(error);
    throw Error("request fail");
  }
};

interface Details {
  id: string;
  language: string;
  status: "running" | "completed";
  build_stdout: string | null;
  build_stderr: string | null;
  build_exit_code: string;
  build_time: string | null;
  build_memory: string | null;
  build_result: "success" | "failure" | "error" | null;
  stdout: string;
  stderr: string | null;
  exit_code: string | null;
  time: string | null;
  memory: string | null;
  result: "success" | "fail" | "error" | null;
}

export const generateSource = async (
  description: string,
): Promise<{
  source?: string;
  errorMessage?: string;
  usage?: GenerateSourceUsage;
}> => {
  const session = await auth();
  try {
    const res = await fetch(`${apiUrl}/api/v1/user/sangakus/generate_source`, {
      method: "POST",
      headers: buildHeaders(session?.accessToken),
      body: JSON.stringify({ description }),
    });

    switch (res.status) {
      case 200: {
        const data = await res.json();
        return { source: data.source as string, usage: data.usage as GenerateSourceUsage };
      }
      case 401:
        await customSignOut();
        return {};
      case 429:
        return {
          errorMessage:
            "本日の利用上限に達しました。明日 3 時以降に再度お試しください。",
        };
      default:
        return { errorMessage: "コードの生成に失敗しました" };
    }
  } catch (e) {
    if (isRedirectError(e)) {
      throw e;
    }
    return { errorMessage: "コードの生成に失敗しました" };
  }
};

const getDetails = async (id: string) => {
  const params = new URLSearchParams({
    api_key: "guest",
    id,
  });
  const reqUri = `https://api.paiza.io:443/runners/get_details.json?${params}`;
  try {
    const res = await fetch(reqUri);
    switch (res.status) {
      case 200:
        const data = await res.json();
        return data as Details;
      default:
        throw Error;
    }
  } catch (error) {
    console.error(error);
    throw Error("request fail");
  }
};
