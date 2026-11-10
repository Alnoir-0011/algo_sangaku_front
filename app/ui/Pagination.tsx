"use client";

import type { ComponentProps } from "react";
import MuiPagination from "@mui/material/Pagination";
import { usePathname, useSearchParams, useRouter } from "next/navigation";

interface Props {
  totalPage: number;
}

// MUI の既定は英語（"Go to page 2"）で、スクリーンリーダーが日本語の画面の中で
// 英語を読み上げてしまう。選択中のページは「移動」できないため、文言を分ける。
const getItemAriaLabel: NonNullable<
  ComponentProps<typeof MuiPagination>["getItemAriaLabel"]
> = (type, page, selected) => {
  switch (type) {
    case "first":
      return "最初のページへ移動";
    case "last":
      return "最後のページへ移動";
    case "next":
      return "次のページへ移動";
    case "previous":
      return "前のページへ移動";
    case "page":
      return selected
        ? `${page}ページ目（現在のページ）`
        : `${page}ページ目へ移動`;
    default:
      return "";
  }
};

export default function Pagination({ totalPage }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get("page")) || 1;

  return (
    <MuiPagination
      aria-label="ページ送り"
      getItemAriaLabel={getItemAriaLabel}
      page={currentPage}
      count={totalPage}
      onChange={(_e, page) => {
        const params = new URLSearchParams(searchParams);
        params.set("page", String(page));
        router.push(`${pathname}?${params.toString()}`);
      }}
    />
  );
}
