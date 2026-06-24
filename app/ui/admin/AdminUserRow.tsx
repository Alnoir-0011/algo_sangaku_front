import { Button, TableCell, TableRow } from "@mui/material";
import Link from "next/link";
import type { AdminUser } from "@/app/lib/definitions";

interface Props {
  user: AdminUser;
}

function formatDate(isoString: string): string {
  return isoString.slice(0, 10).replace(/-/g, "/");
}

export default function AdminUserRow({ user }: Props) {
  const { id, attributes } = user;

  return (
    <TableRow>
      <TableCell>{attributes.name}</TableCell>
      <TableCell>{attributes.email}</TableCell>
      <TableCell>{attributes.role}</TableCell>
      <TableCell>{attributes.sangaku_count}</TableCell>
      <TableCell>{attributes.answer_count}</TableCell>
      <TableCell>{formatDate(attributes.created_at)}</TableCell>
      <TableCell>
        <Button
          component={Link}
          href={`/admin/users/${id}/edit`}
          variant="outlined"
          size="small"
        >
          編集
        </Button>
      </TableCell>
    </TableRow>
  );
}
