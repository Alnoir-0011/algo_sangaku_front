// Import styles, initialize component theme here.
// import '../src/common.css';
import { beforeMount } from "@playwright/experimental-ct-react/hooks";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import theme from "@/theme";
import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";

type HooksConfig = {
  session?: Session | null;
};

beforeMount<HooksConfig>(({ App, hooksConfig }) => {
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
