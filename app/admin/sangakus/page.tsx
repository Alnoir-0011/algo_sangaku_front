import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { fetchAdminSangakus } from "@/app/lib/data/admin";
import AdminSangakuRow from "@/app/ui/admin/AdminSangakuRow";
import Pagination from "@/app/ui/Pagination";

interface Props {
  searchParams: Promise<{ page?: string; query?: string }>;
}

export default async function AdminSangakusPage({ searchParams }: Props) {
  const { page, query } = await searchParams;
  const { sangakus, totalPages } = await fetchAdminSangakus(Number(page) || 1, query);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        算額管理
      </Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>タイトル</TableCell>
            <TableCell>作成者</TableCell>
            <TableCell>奉納神社</TableCell>
            <TableCell>操作</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sangakus.map((sangaku) => (
            <AdminSangakuRow key={sangaku.id} sangaku={sangaku} />
          ))}
        </TableBody>
      </Table>
      {totalPages > 1 && <Pagination totalPage={totalPages} />}
    </Box>
  );
}
