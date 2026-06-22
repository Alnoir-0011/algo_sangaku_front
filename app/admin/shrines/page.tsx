import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { fetchAdminShrines } from "@/app/lib/data/admin";
import AdminShrineRow from "@/app/ui/admin/AdminShrineRow";
import Pagination from "@/app/ui/Pagination";

interface Props {
  searchParams: Promise<{ page?: string; query?: string }>;
}

export default async function AdminShrinesPage({ searchParams }: Props) {
  const { page, query } = await searchParams;
  const result = await fetchAdminShrines(Number(page) || 1, query);

  if (!result) {
    return (
      <Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Typography variant="h4">神社管理</Typography>
          <Button variant="contained" component={Link} href="/admin/shrines/new">
            神社を追加
          </Button>
        </Box>
        <Typography color="error">データを取得できませんでした</Typography>
      </Box>
    );
  }

  const { shrines, totalPages } = result;

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4">神社管理</Typography>
        <Button variant="contained" component={Link} href="/admin/shrines/new">
          神社を追加
        </Button>
      </Box>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>神社名</TableCell>
            <TableCell>住所</TableCell>
            <TableCell>算額数</TableCell>
            <TableCell>操作</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {shrines.map((shrine) => (
            <AdminShrineRow key={shrine.id} shrine={shrine} />
          ))}
        </TableBody>
      </Table>
      {totalPages > 1 && <Pagination totalPage={totalPages} />}
    </Box>
  );
}
