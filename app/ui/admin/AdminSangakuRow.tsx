import { Box, Button, TableCell, TableRow } from "@mui/material";
import Link from "next/link";
import type { AdminSangaku } from "@/app/lib/definitions";
import { deleteSangaku } from "@/app/lib/actions/admin";
import AdminDeleteButton from "./AdminDeleteButton";

interface Props {
  sangaku: AdminSangaku;
}

export default function AdminSangakuRow({ sangaku }: Props) {
  const { id, attributes } = sangaku;
  const deleteAction = deleteSangaku.bind(null, id);

  return (
    <TableRow>
      <TableCell>{attributes.title}</TableCell>
      <TableCell>{attributes.user_name}</TableCell>
      <TableCell>{attributes.shrine_name ?? "未奉納"}</TableCell>
      <TableCell>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            component={Link}
            href={`/admin/sangakus/${id}/edit`}
            variant="outlined"
            size="small"
          >
            編集
          </Button>
          <AdminDeleteButton
            action={deleteAction}
            confirmMessage="この算額を削除しますか？"
          />
        </Box>
      </TableCell>
    </TableRow>
  );
}
