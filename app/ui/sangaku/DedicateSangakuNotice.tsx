import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";

export default function DedicateSangakuNotice() {
  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        mb: 2,
      }}
    >
      <Typography variant="body2">
        手持ちの算額は、まだ誰にも公開されていません。神社の100m以内で奉納すると、その神社で公開されます。
      </Typography>
      <Button
        variant="contained"
        LinkComponent={NextLink}
        href="/shrines"
        sx={{ mt: 1 }}
      >
        神社を探す
      </Button>
    </Box>
  );
}
