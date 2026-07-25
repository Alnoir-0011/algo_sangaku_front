"use client";

import { useState } from "react";
import { createSangakuSave } from "@/app/lib/actions/shrine";
import { Button } from "@mui/material";

interface Props {
  id: string;
  saved: boolean;
}

export function SangakuSaveButton({ id, saved }: Props) {
  const [isSaved, setIsSaved] = useState(saved);

  return (
    <Button
      variant="contained"
      disabled={isSaved}
      onClick={async () => {
        if (await createSangakuSave(id)) {
          setIsSaved(true);
        }
      }}
    >
      {isSaved ? "保存済み" : "算額を写す"}
    </Button>
  );
}
