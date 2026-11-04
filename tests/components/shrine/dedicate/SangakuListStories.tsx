import { Suspense, useMemo } from "react";
import SangakuList from "@/app/ui/shrine/dedicate/SangakuList";
import type { Sangaku, Shrine } from "@/app/lib/definitions";

// Playwright CT は Promise を props として渡せないため、ブラウザ側で解決済みの
// Promise を作って SangakuList に渡すラッパー。page が取得関数の Promise を作って
// 渡す流れの代わりで、props が変わると新しい Promise に差し替わる（再取得の再現）。
export function SangakuListWithPromise({
  sangakus,
  totalPage,
  shrine,
  message,
}: {
  sangakus: Sangaku[];
  totalPage: number;
  shrine: Shrine;
  message?: string;
}) {
  const sangakusPromise = useMemo(
    () => Promise.resolve({ sangakus, totalPage, message }),
    [sangakus, totalPage, message],
  );

  return (
    <Suspense fallback={null}>
      <SangakuList sangakusPromise={sangakusPromise} shrine={shrine} />
    </Suspense>
  );
}
