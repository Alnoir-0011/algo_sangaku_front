"use client";

import { useEffect, useState } from "react";
import { consumeFlash, Flash } from "@/app/lib/actions/flash";
import FlashMessagePresentation from "@/app/ui/flash/FlashMessagePresentation";
import { v4 as uuid } from "uuid";

type Props = {
  refreshKey: number;
};

export default function FlashMessageContainer({ refreshKey }: Props) {
  // key は、同じ文言が続けて来ても FlashMessagePresentation を作り直して、開閉の state を
  // 戻すためのもの。
  const [current, setCurrent] = useState<{ flash: Flash; key: string } | null>(
    null,
  );

  // 古い応答を捨てる ignore フラグは付けない。consumeFlash は cookie を読んで消す破壊的な
  // 読み出しで、捨てた結果は二度と取り戻せない。応答が届く前に refreshKey が変わる
  // （Server Action が cookie を消すと、サーバー描画がやり直されて Date.now() が変わる。
  // 開発サーバーでは、Strict Mode の二重実行も重なる）と、サインイン時の flash が消えていた。
  // Server Action は直列に実行されるため、遅れて届く結果は、古いものではなく、新しいものになる
  useEffect(() => {
    (async () => {
      try {
        const flash = await consumeFlash();
        if (flash) {
          setCurrent({ flash, key: uuid() });
        }
      } catch (error) {
        console.error("Error in FlashMessage component:", error);
      }
    })();
  }, [refreshKey]);

  if (!current) {
    return null;
  }

  return (
    <FlashMessagePresentation
      key={current.key}
      type={current.flash.type}
      message={current.flash.message}
    />
  );
}
