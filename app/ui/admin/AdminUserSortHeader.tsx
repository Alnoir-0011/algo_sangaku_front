"use client";

import { TableCell, TableSortLabel } from "@mui/material";
import Link from "next/link";

interface Props {
  currentSort: "asc" | "desc" | undefined;
  query?: string;
}

function toAriaSort(sort: "asc" | "desc" | undefined): "ascending" | "descending" {
  return sort === "asc" ? "ascending" : "descending";
}

export default function AdminUserSortHeader({ currentSort, query }: Props) {
  const nextSort = currentSort === "asc" ? "desc" : "asc";
  const params = new URLSearchParams();
  if (query) params.set("query", query);
  params.set("sort", nextSort);
  const href = `?${params.toString()}`;

  return (
    <TableCell
      component="th"
      scope="col"
      aria-sort={toAriaSort(currentSort)}
    >
      <TableSortLabel
        active={true}
        direction={currentSort ?? "desc"}
        component={Link}
        href={href}
        data-testid="sort-link"
      >
        登録日時
      </TableSortLabel>
    </TableCell>
  );
}
