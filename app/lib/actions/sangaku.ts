"use server";

import { auth, signOut } from "@/auth";
import { revalidatePath } from "next/cache";
// import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";
import { setFlash } from "@/app/lib/actions/flash";

const apiUrl = process.env.NEXT_PUBLIC_API_URL!;

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
  fixed_inputs: string[],
) => {
  const session = await auth();
  const title = formData.get("title");
  const description = formData.get("description");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session?.accessToken}`,
  };
  const params = {
    sangaku: {
      title,
      description,
      source,
    },
    fixed_inputs,
  };

  try {
    const res = await fetch(`${apiUrl}/api/v1/user/sangakus`, {
      method: "POST",
      headers,
      body: JSON.stringify(params),
    });

    switch (res.status) {
      case 200:
        await setFlash({ type: "success", message: "算額を作成しました" });
        // revalidatePath("/sangakus");
        redirect("/");
      case 401:
        await setFlash({
          type: "error",
          message:
            "セッションの有効期限が切れています。\n再度ログインしてください",
        });
        await signOut({ redirectTo: "/signin" });
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
    console.log(error);
    await setFlash({ type: "error", message: "予期せぬエラーが発生しました" });
    return {
      // message: "予期せぬエラーが発生しました",
      values: { title, description },
    } as State;
  }
};

export const deleteSangaku = async (id: string) => {
  const session = await auth();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session?.accessToken}`,
  };

  try {
    const res = await fetch(`${apiUrl}/api/v1/user/sangakus/${id}`, {
      method: "DELETE",
      headers,
    });

    switch (res.status) {
      case 200:
        revalidatePath("/user/sangakus");
        break;
      case 401:
        await signOut({ redirectTo: "/signin" });
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
