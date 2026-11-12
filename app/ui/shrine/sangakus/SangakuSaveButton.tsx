"use client";

import { useState, useTransition } from "react";
import { createSangakuSave } from "@/app/lib/actions/shrine";
import { Button } from "@mui/material";
import { useKeepScreenOnFailure } from "@/app/ui/flash/SubmitFailureNotice";

interface Props {
  id: string;
  saved: boolean;
}

export function SangakuSaveButton({ id, saved }: Props) {
  const [isSaved, setIsSaved] = useState(saved);
  const [isPending, startTransition] = useTransition();
  const keepScreenOnFailure = useKeepScreenOnFailure();

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
