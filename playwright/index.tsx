// Import styles, initialize component theme here.
// import '../src/common.css';
import { beforeMount } from "@playwright/experimental-ct-react/hooks";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import theme from "@/theme";
import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import {
  fetchUserSangakuDelay,
  fetchUserSangakuRejects,
  fetchUserSangakuResultRejects,
} from "@/tests/__mocks__/data/sangaku";
import { runSourceBehavior } from "@/tests/__mocks__/actions/sangaku";
import { consumeFlashBehavior } from "@/tests/__mocks__/actions/flash";
import { actionBehavior } from "@/tests/__mocks__/action-behavior";
import type { Flash } from "@/app/lib/actions/flash";

type HooksConfig = {
  session?: Session | null;
  // テストからローディング状態を確実に再現するための遅延時間（ms）。
  // テストファイルとコンポーネントはブラウザ側で別々にバンドルされるため、
  // fetchUserSangakuDelay を直接 import して書き換えてもコンポーネント側には
  // 反映されない。hooksConfig 経由でブラウザ側の beforeMount から設定する。
  fetchUserSangakuDelayMs?: number;
  // 先頭から指定回数だけ fetchUserSangaku / fetchUserSangakuResult を reject させる。
  fetchUserSangakuRejectCount?: number;
  fetchUserSangakuResultRejectCount?: number;
  // runSource の呼び出し順の遅延（ms）、先頭から reject する回数、結果に source を含めるか。
  runSourceDelaysMs?: number[];
  runSourceRejectCount?: number;
  runSourceEchoSource?: boolean;
  // consumeFlash が呼び出し順に返すフラッシュと、先頭から reject する回数。
  consumeFlashQueue?: (Flash | null)[];
  consumeFlashRejectCount?: number;
  // true のとき、Server Action のモック（createSangakuSave・dedicateSangaku・createAnswer）が、
  // window.__releaseActions() が呼ばれるまで応答を保留する。
  actionHold?: boolean;
  // 先頭から指定回数だけ、同じ Server Action のモックを reject させる（通信失敗の再現）。
  actionRejectCount?: number;
};

beforeMount<HooksConfig>(({ App, hooksConfig }) => {
  fetchUserSangakuDelay.ms = hooksConfig?.fetchUserSangakuDelayMs ?? 0;
  fetchUserSangakuRejects.count = hooksConfig?.fetchUserSangakuRejectCount ?? 0;
  fetchUserSangakuResultRejects.count =
    hooksConfig?.fetchUserSangakuResultRejectCount ?? 0;
  runSourceBehavior.delaysMs = [...(hooksConfig?.runSourceDelaysMs ?? [])];
  runSourceBehavior.rejectCount = hooksConfig?.runSourceRejectCount ?? 0;
  runSourceBehavior.echoSource = hooksConfig?.runSourceEchoSource ?? false;
  consumeFlashBehavior.queue = [...(hooksConfig?.consumeFlashQueue ?? [])];
  consumeFlashBehavior.rejectCount = hooksConfig?.consumeFlashRejectCount ?? 0;
  actionBehavior.hold = hooksConfig?.actionHold ?? false;
  actionBehavior.rejectCount = hooksConfig?.actionRejectCount ?? 0;
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
