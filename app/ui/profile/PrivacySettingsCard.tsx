"use client";

import {
  Box,
  FormControlLabel,
  Switch,
  Typography,
} from "@mui/material";
import { useState, useTransition } from "react";
import { updateShowAnswerCount } from "@/app/lib/actions/profile";

interface Props {
  showAnswerCount: boolean;
}

export default function PrivacySettingsCard({ showAnswerCount }: Props) {
  const [checked, setChecked] = useState(showAnswerCount);
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.checked;
    setChecked(next);
    startTransition(async () => {
      const result = await updateShowAnswerCount(next);
      if (!result.success) {
        setChecked(!next);
      }
    });
  };

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight="bold" mb={1}>
        プライバシー設定
      </Typography>
      <FormControlLabel
        control={
          <Switch
            checked={checked}
            onChange={handleChange}
            disabled={isPending}
          />
        }
        label="提出した回答数を公開プロフィールに表示する"
      />
    </Box>
  );
}
