import { Box, Toolbar } from "@mui/material";
import Stack from "@mui/material/Stack";
import ResponsiveNav from "@/app/ui/navigation/ResponsiveNav";
import Footer from "@/app/ui/navigation/Footer";

const drawerWidth = 240;

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Box sx={{ display: "flex" }}>
      <ResponsiveNav drawerWidth={drawerWidth} />
      <Stack
        sx={{
          flexGrow: 1,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: "100vh",
          // 旧 Grid container は min-width: 0 を持っていた。Stack は持たないため、長い URL など
          // 折り返せない子要素に合わせて本文の列ごと画面幅を超えて広がってしまう。
          minWidth: 0,
          justifyContent: "start",
        }}
      >
        <Toolbar />
        <Box component="main" sx={{ p: 3, flexGrow: 1 }}>
          {children}
        </Box>
        <Footer />
      </Stack>
    </Box>
  );
}
