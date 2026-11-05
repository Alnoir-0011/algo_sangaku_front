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

  useEffect(() => {
    let ignore = false;

    (async () => {
      try {
        const flash = await consumeFlash();
        if (!ignore && flash) {
          setCurrent({ flash, key: uuid() });
        }
      } catch (error) {
        if (!ignore) {
          console.error("Error in FlashMessage component:", error);
        }
      }
    })();

    return () => {
      ignore = true;
    };
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
