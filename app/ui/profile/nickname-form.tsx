"use client";

import { Box, Button, TextField, Typography } from "@mui/material";
import { useActionState } from "react";
import { updateProfile, State } from "@/app/lib/actions/profile";

interface Props {
  nickname: string;
}

export default function NicknameForm({ nickname }: Props) {
  const initialState: State = { values: { nickname } };
  const [state, formAction, isPending] = useActionState(
    updateProfile,
    initialState,
  );

  return (
    <form action={formAction}>
      <Box display="flex" gap={1} alignItems="flex-start">
        <Box flex={1}>
          <TextField
            required
            fullWidth
            label="ニックネーム"
            name="nickname"
            size="small"
            defaultValue={state.values?.nickname ?? nickname}
          />
          {state.errors?.nickname &&
            state.errors.nickname.map((error: string) => (
              <Typography
                aria-label="nicknameError"
                key={error}
                variant="caption"
                sx={{ color: "error.main" }}
              >
                {error}
              </Typography>
            ))}
        </Box>
        <Button
          variant="contained"
          type="submit"
          size="small"
          disabled={isPending}
          sx={{ mt: 0.5 }}
        >
          保存
        </Button>
      </Box>
    </form>
  );
}
