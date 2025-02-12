import { AppBar, Typography } from "@mui/material";

interface Props {
  drawerWidth: number;
};

export default function Footer({ drawerWidth }: Props) {
  return (
    <AppBar
      position="fixed"
      component="footer"
      sx={{
        top: 'auto',
        bottom: 0,
        bgcolor: "#ECEBEB",
        width: { sm: `calc(100% - ${drawerWidth}px)` },
        ml: { sm: `${drawerWidth}px` },
        p: 1.5
      }}
    >
      <Typography sx={{ ml: "auto" }}>©︎AlgoSangaku</Typography>
    </AppBar>
  )
}
