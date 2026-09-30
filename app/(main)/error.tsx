"use client";

import { useEffect } from "react";
import { Box, Link, Typography } from "@mui/material";
import Ema from "@/app/ui/Ema";
import NextLink from "next/link";

export default function Error({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

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
              エラーが発生しました
            </Typography>
          </Box>
          <Typography sx={{ textAlign: "center" }}>
            予期しない問題が発生しました。時間をおいて再度お試しください。
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
