import { Box, Button, Typography } from "@mui/material";
import Link from "next/link";

export default function NotFound() {
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
        404
      </Typography>
      <Typography variant="body1" color="text.secondary">
        ページが見つかりません
      </Typography>
      <Button component={Link} href="/admin" variant="outlined" sx={{ mt: 2 }}>
        管理画面トップへ戻る
      </Button>
    </Box>
  );
}
