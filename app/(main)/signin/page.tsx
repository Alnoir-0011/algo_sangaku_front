import { redirect } from "next/navigation";
import { auth, getProviderMap } from "@/auth";
import { requestHeaders } from "@/app/lib/session";
import { safeCallbackPath } from "@/app/lib/safe-callback-path";
import { signinPath } from "@/routes";
import { Alert, Box, Button, Paper, Typography } from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "サインイン",
};

interface Props {
  searchParams: Promise<{
    callbackUrl: string | undefined;
    error: string | undefined;
  }>;
}

// Better Auth は、コールバックで失敗するとここへ ?error=<コード> を付けて戻す。
// コードの値は画面に出さず、失敗したことだけを伝える
const SIGNIN_FAILED_MESSAGE =
  "サインインに失敗しました。もう一度お試しください。";

// アイコンと色は、Better Auth のプロバイダーが持たないため、id ごとに用意する。
// 無いプロバイダーは、アイコンなし・既定の色で出る
const PROVIDER_STYLES: Record<string, { icon: ReactNode; color: string }> = {
  google: { icon: <GoogleIcon sx={{ mr: 1 }} />, color: "#4285F4" },
};

export default async function Signin(props: Props) {
  const searchParams = await props.searchParams;
  const providers = await getProviderMap();
  const callbackURL = safeCallbackPath(searchParams.callbackUrl);
  // /error のような実在しないパスを渡すと、proxy が未ログインの非公開パスとして
  // /signin へ返し、失敗の通知が出ないまま警告の flash だけが残る。
  // 再試行でも戻り先を失わないよう、callbackUrl を引き継ぐ
  const errorCallbackURL =
    callbackURL === "/"
      ? signinPath
      : `${signinPath}?callbackUrl=${encodeURIComponent(callbackURL)}`;

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
      }}
    >
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          サインイン
        </Typography>
        {searchParams.error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {SIGNIN_FAILED_MESSAGE}
          </Alert>
        )}
        {providers.map((provider) => (
          <form
            key={provider.id}
            action={async () => {
              "use server";
              const { url } = await auth.api.signInSocial({
                body: {
                  provider: provider.id,
                  callbackURL,
                  errorCallbackURL,
                },
                headers: await requestHeaders(),
              });
              redirect(url!);
            }}
          >
            <Button
              variant="contained"
              type="submit"
              sx={{ bgcolor: PROVIDER_STYLES[provider.id]?.color }}
            >
              {PROVIDER_STYLES[provider.id]?.icon}
              <span>{provider.name}でサインイン</span>
            </Button>
          </form>
        ))}
      </Paper>
    </Box>
  );
}
