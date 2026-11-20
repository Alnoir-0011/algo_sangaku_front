"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { authClient } from "@/app/lib/auth-client";

// Server Action のサインアウトは、サーバー側で cookie を消して redirect するだけで、
// Better Auth のクライアントを通らないため、useSession が更新されない。
// router.refresh() はサーバーコンポーネントを描画し直すだけで、クライアントの
// セッションの store は更新しない。遷移のたびに再取得を促して追従させる
export default function SessionSync() {
  const pathname = usePathname();
  const previous = useRef(pathname);

  useEffect(() => {
    if (previous.current === pathname) return;
    previous.current = pathname;
    authClient.$store.notify("$sessionSignal");
  }, [pathname]);

  return null;
}
