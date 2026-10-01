import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

export default function DedicatedSangakuEditNotice() {
  return (
    <Box sx={{ textAlign: "center", mt: 4 }}>
      <Typography sx={{ mb: 2 }}>この算額は奉納済みのため更新できません</Typography>
      <Button variant="contained" href="/user/sangakus">
        一覧へ戻る
      </Button>
    </Box>
  );
}
