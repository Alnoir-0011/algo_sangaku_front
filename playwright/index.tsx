// Import styles, initialize component theme here.
// import '../src/common.css';
import { beforeMount } from "@playwright/experimental-ct-react/hooks";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import theme from "@/theme";
import { SessionProvider } from "next-auth/react";

beforeMount(({ App }) => {
  return Promise.resolve(
    <SessionProvider>
      <AppRouterCacheProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <App />
        </ThemeProvider>
      </AppRouterCacheProvider>
    </SessionProvider>,
  );
});
