import { isRedirectError } from "next/dist/client/components/redirect-error";

// startTransition(async …) の中で起きた例外は、最も近い Error Boundary へ投げられ、
// error.tsx の全画面エラーに置き換わる。onClick 内で await していたときは画面が残り
// ボタンが再び押せるだけだったので、通信失敗でその挙動が変わらないよう、ここで受ける。
// redirect は Next.js が例外で遷移を伝えるため、握りつぶさずに投げ直す。
export async function keepScreenOnFailure(
  task: () => Promise<void>,
): Promise<void> {
  try {
    await task();
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error("[keepScreenOnFailure]", error);
  }
}
