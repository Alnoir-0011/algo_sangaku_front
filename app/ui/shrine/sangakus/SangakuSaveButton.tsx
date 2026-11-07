"use client";

import { useState, useTransition } from "react";
import { createSangakuSave } from "@/app/lib/actions/shrine";
import { Button } from "@mui/material";
import { keepScreenOnFailure } from "@/app/lib/keep-screen-on-failure";

interface Props {
  id: string;
  saved: boolean;
}

export function SangakuSaveButton({ id, saved }: Props) {
  const [isSaved, setIsSaved] = useState(saved);
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="contained"
      disabled={isSaved || isPending}
      onClick={() => {
        startTransition(() =>
          keepScreenOnFailure(async () => {
            if (await createSangakuSave(id)) {
              setIsSaved(true);
            }
          }),
        );
      }}
    >
      {isSaved ? "保存済み" : "算額を写す"}
    </Button>
  );
}
