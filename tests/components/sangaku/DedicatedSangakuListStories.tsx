import { Suspense, useMemo } from "react";
import DedicatedSangakuList from "@/app/ui/sangaku/DedicatedSangakuList";
import type { Sangaku } from "@/app/lib/definitions";

// Playwright CT は Promise を props として渡せないため、ブラウザ側で解決済みの
// Promise を作って DedicatedSangakuList に渡すラッパー。page が取得関数の Promise を
// 作って渡す流れの代わりで、props が変わると新しい Promise に差し替わる（再取得の再現）。
export function DedicatedSangakuListWithPromise({
  sangakus,
  totalPage,
  message,
}: {
  sangakus: Sangaku[];
  totalPage: number;
  message?: string;
}) {
  const sangakusPromise = useMemo(
    () => Promise.resolve({ sangakus, totalPage, message }),
    [sangakus, totalPage, message],
  );

  return (
    <Suspense fallback={null}>
      <DedicatedSangakuList sangakusPromise={sangakusPromise} />
    </Suspense>
  );
}
