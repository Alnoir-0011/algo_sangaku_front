import { Box, Typography } from "@mui/material";
import { fetchAdminSangaku } from "@/app/lib/data/admin";
import AdminSangakuForm from "@/app/ui/admin/AdminSangakuForm";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminSangakuEditPage({ params }: Props) {
  const { id } = await params;
  const sangaku = await fetchAdminSangaku(id);

  if (!sangaku) notFound();

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        算額詳細・編集
      </Typography>
      <AdminSangakuForm sangaku={sangaku} />
    </Box>
  );
}
