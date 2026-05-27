"use client";

import { Button } from "@mui/material";

interface Props {
  action: () => Promise<boolean>;
  confirmMessage: string;
}

export default function AdminDeleteButton({ action, confirmMessage }: Props) {
  const handleClick = async () => {
    if (!confirm(confirmMessage)) return;
    await action();
  };

  return (
    <Button
      type="button"
      variant="outlined"
      color="error"
      size="small"
      onClick={handleClick}
    >
      削除
    </Button>
  );
}
