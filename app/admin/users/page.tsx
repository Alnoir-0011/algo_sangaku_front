import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { fetchAdminUsers } from "@/app/lib/data/admin";
import AdminUserRow from "@/app/ui/admin/AdminUserRow";
import Pagination from "@/app/ui/Pagination";

interface Props {
  searchParams: Promise<{ page?: string; query?: string }>;
}

export default async function AdminUsersPage({ searchParams }: Props) {
  const { page, query } = await searchParams;
  const { users, totalPages } = await fetchAdminUsers(Number(page) || 1, query);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        ユーザー管理
      </Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>名前</TableCell>
            <TableCell>メール</TableCell>
            <TableCell>ロール</TableCell>
            <TableCell>算額数</TableCell>
            <TableCell>解答数</TableCell>
            <TableCell>操作</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((user) => (
            <AdminUserRow key={user.id} user={user} />
          ))}
        </TableBody>
      </Table>
      {totalPages > 1 && <Pagination totalPage={totalPages} />}
    </Box>
  );
}
