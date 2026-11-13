"use client";

import type { ComponentProps } from "react";
import { useSession } from "next-auth/react";
import NextLink from "@/app/ui/shared/NextLink";

// proxy では next/link のプリフェッチを判別できない（Next が rsc / next-router-prefetch を
// proxy の前に削除する）ため、未ログインのプリフェッチが付ける flash cookie は、
// proxy 側では止められず、リンク側で止める。loading 中もログイン状態が未確定なので止める。
export default function ProtectedLink(props: ComponentProps<typeof NextLink>) {
  const { status } = useSession();

  return (
    <NextLink
      {...props}
      prefetch={status === "authenticated" ? props.prefetch : false}
    />
  );
}
