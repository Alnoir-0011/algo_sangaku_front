"use client";

import MuiPagination from "@mui/material/Pagination";
import { usePathname, useSearchParams, useRouter } from "next/navigation";

interface Props {
  totalPage: number;
}

export default function Pagination({ totalPage }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get("page")) || 1;

  console.log(pathname);

  return (
    <MuiPagination
      page={currentPage}
      count={totalPage}
      onChange={(_e, page) => {
        console.log(page);
        router.push(`${pathname}?page=${page}`);
      }}
    />
  );
}
