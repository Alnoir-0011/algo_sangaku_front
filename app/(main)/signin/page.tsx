import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { requestHeaders } from "@/app/lib/session";
import { safeCallbackPath } from "@/app/lib/safe-callback-path";
import { signinPath } from "@/routes";
import { testSignIn } from "@/app/lib/actions/test-sign-in";
import {
  Alert,
  Box,
  Button,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import { Metadata } from "next";

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

export default async function Signin(props: Props) {
  const searchParams = await props.searchParams;
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
        <form
          action={async () => {
            "use server";
            const { url } = await auth.api.signInSocial({
              body: {
                provider: "google",
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
            sx={{ bgcolor: "#4285F4" }}
          >
            <GoogleIcon sx={{ mr: 1 }} />
            <span>Googleでサインイン</span>
          </Button>
        </form>
        {process.env.APP_ENV === "test" && (
          <form
            action={testSignIn}
            style={{ display: "grid", gap: 8, marginTop: 16 }}
          >
            <TextField label="Email" name="email" type="email" required />
            <TextField
              label="Password"
              name="password"
              type="password"
              required
            />
            <Button variant="outlined" type="submit">
              Sign in with Credentials
            </Button>
          </form>
        )}
      </Paper>
    </Box>
  );
}
