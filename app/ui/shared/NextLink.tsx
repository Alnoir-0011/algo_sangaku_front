"use client";

import Link from "next/link";

// Next 16 では Server Component が import した next/link は client reference ではなく
// 関数そのものになり、MUI の component / LinkComponent に渡すと
// "Functions cannot be passed directly to Client Components" で落ちる。
// 直接 import せず、このファイル経由で client reference にする
// https://mui.com/material-ui/integrations/nextjs
export default Link;
