"use client";

import { useEffect, useState } from "react";
import { consumeFlash, Flash } from "@/app/lib/actions/flash";
import FlashMessagePresentation from "@/app/ui/flash/FlashMessagePresentation";
import { v4 as uuid } from "uuid";

type Props = {
  refreshKey: number;
};

export default function FlashMessageContainer({ refreshKey }: Props) {
  const [flash, setFlash] = useState<(Flash & { key: string }) | null>(null);

  useEffect(() => {
    let cancelled = false;
    consumeFlash()
      .then((data) => {
        if (!cancelled && data) {
          setFlash({ ...data, key: uuid() });
        }
      })
      .catch((error) => {
        if (!cancelled) {
          console.error("Error in FlashMessage component:", error);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  if (!flash) {
    return null;
  }

  return (
    <FlashMessagePresentation
      key={flash.key}
      type={flash.type}
      message={flash.message}
    />
  );
}
