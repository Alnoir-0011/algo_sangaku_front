"use client";

import { useEffect } from "react";
import { Box, Button, Typography } from "@mui/material";
import Link from "next/link";

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
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        gap: 2,
      }}
    >
      <Typography variant="h3" component="h1">
        エラーが発生しました
      </Typography>
      <Typography variant="body1" color="text.secondary">
        予期しない問題が発生しました
      </Typography>
      <Button component={Link} href="/admin" variant="outlined" sx={{ mt: 2 }}>
        管理画面トップへ戻る
      </Button>
    </Box>
  );
}
