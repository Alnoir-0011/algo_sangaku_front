"use client";

import { createSangakuSave } from "@/app/lib/actions/shrine";
import { Button } from "@mui/material";

interface Props {
  id: string;
}

export function SangakuSaveButton({ id }: Props) {
  return (
    <Button
      variant="contained"
      onClick={() => {
        createSangakuSave(id);
      }}
    >
      算額を写す
    </Button>
  );
}
