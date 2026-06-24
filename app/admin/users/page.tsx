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
import AdminUserSortHeader from "@/app/ui/admin/AdminUserSortHeader";
import Pagination from "@/app/ui/Pagination";
import Search from "@/app/ui/Search";

interface Props {
  searchParams: Promise<{ page?: string; query?: string; sort?: string }>;
}

export default async function AdminUsersPage({ searchParams }: Props) {
  const { page, query, sort } = await searchParams;
  const sortParam = sort === "asc" || sort === "desc" ? sort : undefined;
  const result = await fetchAdminUsers(Number(page) || 1, query, sortParam);

  if (!result) {
    return (
      <Box>
        <Typography variant="h4" sx={{ mb: 3 }}>
          ユーザー管理
        </Typography>
        <Typography color="error">データを取得できませんでした</Typography>
      </Box>
    );
  }

  const { users, totalPages } = result;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        ユーザー管理
      </Typography>
      <Search placeholder="ユーザーを検索" />
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ニックネーム</TableCell>
            <TableCell>メール</TableCell>
            <TableCell>ロール</TableCell>
            <TableCell>算額数</TableCell>
            <TableCell>解答数</TableCell>
            <AdminUserSortHeader currentSort={sortParam} query={query} />
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
