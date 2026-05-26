import { Box, Typography } from "@mui/material";
import AdminShrineForm from "@/app/ui/admin/AdminShrineForm";

export default function AdminShrineNewPage() {
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        神社を追加
      </Typography>
      <AdminShrineForm />
    </Box>
  );
}
