// Import styles, initialize component theme here.
// import '../src/common.css';
import { beforeMount } from "@playwright/experimental-ct-react/hooks";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import theme from "@/theme";
import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import { fetchUserSangakuDelay } from "@/tests/__mocks__/data/sangaku";

type HooksConfig = {
  session?: Session | null;
  // テストからローディング状態を確実に再現するための遅延時間（ms）。
  // テストファイルとコンポーネントはブラウザ側で別々にバンドルされるため、
  // fetchUserSangakuDelay を直接 import して書き換えてもコンポーネント側には
  // 反映されない。hooksConfig 経由でブラウザ側の beforeMount から設定する。
  fetchUserSangakuDelayMs?: number;
};

beforeMount<HooksConfig>(({ App, hooksConfig }) => {
  fetchUserSangakuDelay.ms = hooksConfig?.fetchUserSangakuDelayMs ?? 0;
  return Promise.resolve(
    <SessionProvider session={hooksConfig?.session ?? undefined}>
      <AppRouterCacheProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <App />
        </ThemeProvider>
      </AppRouterCacheProvider>
    </SessionProvider>,
  );
});
