import { Box, Toolbar } from "@mui/material";
import Grid from "@mui/material/Grid2";
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
  );
}
