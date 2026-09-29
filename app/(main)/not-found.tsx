import { Box, Link, Typography } from "@mui/material";
import Ema from "@/app/ui/Ema";
import NextLink from "next/link";

export default function NotFound() {
  return (
    <Box>
      <Box sx={{ display: "flex", mb: "2rem" }}>
        <Typography
          variant="h3"
          component="h1"
          sx={{ mx: "auto", fontFamily: "Noto Serif JP Variable" }}
        >
          アルゴ算額
        </Typography>
      </Box>
      <Box sx={{ display: "flex", justifyContent: "center", mb: "3rem" }}>
        <Ema width={21}>
          <Box sx={{ display: "flex", justifyContent: "center", mb: "1rem" }}>
            <Typography variant="h4" component="h2">
              404
            </Typography>
          </Box>
          <Typography sx={{ textAlign: "center" }}>
            お探しのページは見つかりませんでした
          </Typography>
        </Ema>
      </Box>
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <Link component={NextLink} href="/">
          <Ema width={10}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                height: "100%",
                alignItems: "center",
                color: "black",
              }}
            >
              <Typography variant="h6" component="span">
                トップへ戻る
              </Typography>
            </Box>
          </Ema>
        </Link>
      </Box>
    </Box>
  );
}
