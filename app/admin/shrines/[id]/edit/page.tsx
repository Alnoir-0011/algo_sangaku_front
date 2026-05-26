import { Box, Typography } from "@mui/material";
import { fetchAdminShrine } from "@/app/lib/data/admin";
import AdminShrineForm from "@/app/ui/admin/AdminShrineForm";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminShrineEditPage({ params }: Props) {
  const { id } = await params;
  const shrine = await fetchAdminShrine(id);

  if (!shrine) notFound();

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        神社詳細・編集
      </Typography>
      <AdminShrineForm shrine={shrine} />
    </Box>
  );
}
