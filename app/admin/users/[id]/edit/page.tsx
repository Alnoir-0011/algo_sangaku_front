import { Box, Typography } from "@mui/material";
import { fetchAdminUser } from "@/app/lib/data/admin";
import AdminUserForm from "@/app/ui/admin/AdminUserForm";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminUserEditPage({ params }: Props) {
  const { id } = await params;
  const user = await fetchAdminUser(id);

  if (!user) notFound();

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        ユーザー詳細・編集
      </Typography>
      <AdminUserForm user={user} />
    </Box>
  );
}
