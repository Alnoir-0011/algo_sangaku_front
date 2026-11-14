// session callback はサーバー側の auth() と /api/auth/session の本文で共用されるため、
// callback 側ではブラウザへ出す項目を出し分けられない。返す応答の側で絞る。
// 秘匿値を足したときに消し忘れて漏れる denylist にはせず、返してよい項目を列挙する。
// NextResponse.json などで作り直すと Set-Cookie が落ちるため、元の応答を init に渡す。
const BROWSER_SESSION_KEYS = ["user", "expires", "role"];

export async function toBrowserSession(response: Response): Promise<Response> {
  if (!response.body) return response;

  const text = await response.text();
  const session = parseJson(text);
  if (!isRecord(session)) return new Response(text, response);

  const browserSession = Object.fromEntries(
    BROWSER_SESSION_KEYS.filter((key) => key in session).map((key) => [
      key,
      session[key],
    ]),
  );
  const result = new Response(JSON.stringify(browserSession), response);
  result.headers.delete("content-length");
  return result;
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
