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
import type { AdminUser } from "@/app/lib/definitions";
import { updateUser } from "@/app/lib/actions/admin";

interface Props {
  user: AdminUser;
}

export default function AdminUserForm({ user }: Props) {
  const { id, attributes } = user;
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const success = await updateUser(id, formData);
    if (success) router.refresh();
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
      <Button type="submit" variant="contained">
        更新
      </Button>
    </Box>
  );
}
