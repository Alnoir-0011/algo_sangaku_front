"use client";

import { useEffect, useState } from "react";
import { consumeFlash, Flash } from "@/app/lib/actions/flash";
import FlashMessagePresentation from "@/app/ui/flash/FlashMessagePresentation";
import { v4 as uuid } from "uuid";

export default function FlashMessageContainer() {
  const [flash, setFlash] = useState<(Flash & { key: string }) | null>(null);

  useEffect(() => {
    consumeFlash()
      .then((data) => {
        if (data) {
          setFlash({ ...data, key: uuid() });
        }
      })
      .catch((error) => {
        console.error("Error in FlashMessage component:", error);
      });
  }, []);

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
