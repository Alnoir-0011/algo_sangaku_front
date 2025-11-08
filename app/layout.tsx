import type { Metadata } from "next";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { Roboto } from "next/font/google";
import { ThemeProvider } from "@mui/material/styles";
import theme from "@/theme";
import { Box, CssBaseline, Toolbar } from "@mui/material";
import Grid from "@mui/material/Grid2";
import ResponsiveNav from "@/app/ui/navigation/ResponsiveNav";
import "@fontsource-variable/noto-serif-jp";
import Footer from "@/app/ui/navigation/Footer";
import { SessionProvider } from "next-auth/react";
import FlashMessage from "@/app/ui/flash/FlashMessageContainer";
import { GoogleAnalytics } from "@next/third-parties/google";

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: { template: "%s  | アルゴ算額", default: "アルゴ算額" },
  description:
    "プログラミング×神社巡り　オリジナルのアルゴリズム問題を作成して神社に奉納、他のユーザーの作成した算額を解くことができます",
  keywords: [
    "プログラミング",
    "神社",
    "神社巡り",
    "アルゴリズム",
    "プログラミング学習",
  ],
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
};

export const dynamic = "force-dynamic";

const drawerWidth = 240; //px

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SessionProvider>
      <html lang="ja">
        <body className={roboto.variable}>
          <AppRouterCacheProvider>
            <ThemeProvider theme={theme}>
              <FlashMessage />
              <Box sx={{ display: "flex" }}>
                <CssBaseline />
                <ResponsiveNav drawerWidth={240} />
                <Grid
                  container
                  direction="column"
                  sx={{
                    flexGrow: 1,
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    minHeight: "100vh",
                    justifyContent: "start",
                  }}
                >
                  <Toolbar />
                  <Box component="main" sx={{ p: 3, flexGrow: 1 }}>
                    {children}
                  </Box>
                  <Footer />
                </Grid>
              </Box>
            </ThemeProvider>
          </AppRouterCacheProvider>
        </body>
        {process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID} />
        )}
      </html>
    </SessionProvider>
  );
}
