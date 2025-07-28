"use client";

import React, { useState } from "react";
import { FlashType } from "@/app/lib/actions/flash";
import Snackbar, { SnackbarCloseReason } from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

type Props = {
  type: FlashType;
  message: string;
};

const DEFAULT_HIDE_DURATION = 5 * 1000;

export default function FlashMessagePresentation({ type, message }: Props) {
  const [open, setOpen] = useState(true);

  const handleClose = (
    _event?: React.SyntheticEvent | Event,
    reason?: SnackbarCloseReason,
  ) => {
    if (reason === "clickaway") {
      return;
    }

    setOpen(false);
  };

  return (
    <Snackbar
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
      open={open}
      autoHideDuration={DEFAULT_HIDE_DURATION}
      onClose={handleClose}
    >
      <Alert
        onClose={handleClose}
        severity={type}
        variant="filled"
        sx={{ width: "100%" }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
}
