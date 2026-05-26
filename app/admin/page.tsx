import { Box, Typography } from "@mui/material";
import { fetchAdminStats } from "@/app/lib/data/admin";
import AdminStats from "@/app/ui/admin/AdminStats";

export default async function AdminDashboardPage() {
  const stats = await fetchAdminStats();

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        管理ダッシュボード
      </Typography>
      {stats && <AdminStats stats={stats} />}
    </Box>
  );
}
