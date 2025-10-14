"use client";

import { Box, Button, TextField, Typography } from "@mui/material";
import { User } from "next-auth";
import { updateProfile, State } from "@/app/lib/actions/profile";
import { useActionState } from "react";

interface Props {
  user: User;
}

export default function Form({ user }: Props) {
  const initialState: State = { values: { nickname: user.nickname } };
  const [state, formAction] = useActionState(updateProfile, initialState);

  return (
    <form action={formAction}>
      <Box mb={1}>
        <TextField
          required
          fullWidth
          label="ニックネーム"
          name="nickname"
          margin="normal"
          defaultValue={user.nickname}
        />
        {state.errors?.nickname &&
          state.errors.nickname.map((error: string) => (
            <Typography
              aria-label="nicknameError"
              key={error}
              sx={{ color: "red" }}
            >
              {error}
            </Typography>
          ))}
      </Box>
      <Box display="flex" justifyContent="end">
        <Button variant="contained" type="submit">
          更新する
        </Button>
      </Box>
    </form>
  );
}
