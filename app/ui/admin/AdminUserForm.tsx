"use client";

import {
  Box,
  Button,
  FormControl,
  InputLabel,
  Select,
  TextField,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { AdminUser } from "@/app/lib/definitions";
import { updateUser } from "@/app/lib/actions/admin";
import { keepScreenOnFailure } from "@/app/lib/keep-screen-on-failure";

interface Props {
  user: AdminUser;
}

export default function AdminUserForm({ user }: Props) {
  const { id, attributes } = user;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() =>
      keepScreenOnFailure(async () => {
        const success = await updateUser(id, formData);
        if (success) router.refresh();
      }),
    );
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 480 }}
    >
      <TextField
        label="名前"
        name="name"
        defaultValue={attributes.name}
        required
      />
      <TextField
        label="ニックネーム"
        name="nickname"
        defaultValue={attributes.nickname}
        required
      />
      <FormControl>
        <InputLabel htmlFor="role-select">ロール</InputLabel>
        <Select
          native
          inputProps={{ id: "role-select" }}
          label="ロール"
          name="role"
          defaultValue={attributes.role}
        >
          <option value="general">general</option>
          <option value="admin">admin</option>
        </Select>
      </FormControl>
      <Button type="submit" variant="contained" disabled={isPending}>
        更新
      </Button>
    </Box>
  );
}
