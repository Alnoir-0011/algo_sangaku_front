import { AppBar, Typography } from "@mui/material";

export default function Footer() {
  return (
    <AppBar
      position="static"
      component="footer"
      sx={{
        bottom: 0,
        bgcolor: "#ECEBEB",
        p: 1.5
      }}
    >
      <Typography sx={{ ml: "auto" }}>©︎AlgoSangaku</Typography>
    </AppBar>
  )
}
