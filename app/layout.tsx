import type { Metadata } from "next";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { Roboto } from "next/font/google";
import { ThemeProvider } from "@mui/material/styles";
import theme from "@/theme";
import { CssBaseline } from "@mui/material";
import "@fontsource-variable/noto-serif-jp";
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
              <CssBaseline />
              <FlashMessage refreshKey={Date.now()} />
              {children}
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
