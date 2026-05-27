import { Box, Button, TableCell, TableRow } from "@mui/material";
import Link from "next/link";
import type { AdminShrine } from "@/app/lib/definitions";
import { deleteShrine } from "@/app/lib/actions/admin";
import AdminDeleteButton from "./AdminDeleteButton";

interface Props {
  shrine: AdminShrine;
}

export default function AdminShrineRow({ shrine }: Props) {
  const { id, attributes } = shrine;
  const deleteAction = deleteShrine.bind(null, id);

  return (
    <TableRow>
      <TableCell>{attributes.name}</TableCell>
      <TableCell>{attributes.address}</TableCell>
      <TableCell>{attributes.sangaku_count}</TableCell>
      <TableCell>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            component={Link}
            href={`/admin/shrines/${id}/edit`}
            variant="outlined"
            size="small"
          >
            編集
          </Button>
          <AdminDeleteButton
            action={deleteAction}
            confirmMessage="この神社を削除しますか？"
          />
        </Box>
      </TableCell>
    </TableRow>
  );
}
