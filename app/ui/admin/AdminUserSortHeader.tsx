"use client";

import { TableCell, TableSortLabel } from "@mui/material";
import Link from "next/link";

interface Props {
  currentSort: "asc" | "desc" | undefined;
}

function toAriaSort(sort: "asc" | "desc"): "ascending" | "descending" {
  return sort === "asc" ? "ascending" : "descending";
}

export default function AdminUserSortHeader({ currentSort }: Props) {
  const nextSort = currentSort === "asc" ? "desc" : "asc";

  return (
    <TableCell
      component="th"
      scope="col"
      aria-sort={currentSort ? toAriaSort(currentSort) : undefined}
    >
      <TableSortLabel
        active={currentSort !== undefined}
        direction={currentSort ?? "asc"}
        component={Link}
        href={`?sort=${nextSort}`}
        data-testid="sort-link"
        role="button"
      >
        登録日時
      </TableSortLabel>
    </TableCell>
  );
}
