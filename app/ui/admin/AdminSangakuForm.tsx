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
import type { AdminSangaku } from "@/app/lib/definitions";
import { updateSangaku } from "@/app/lib/actions/admin";

interface Props {
  sangaku: AdminSangaku;
}

export default function AdminSangakuForm({ sangaku }: Props) {
  const { id, attributes } = sangaku;
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const success = await updateSangaku(id, formData);
    if (success) router.refresh();
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 480 }}
    >
      <TextField
        label="タイトル"
        name="title"
        defaultValue={attributes.title}
        required
      />
      <FormControl>
        <InputLabel htmlFor="difficulty-select">難易度</InputLabel>
        <Select
          native
          inputProps={{ id: "difficulty-select" }}
          label="難易度"
          name="difficulty"
          defaultValue={attributes.difficulty}
        >
          <option value="easy">easy</option>
          <option value="normal">normal</option>
          <option value="difficult">difficult</option>
          <option value="very_difficult">very_difficult</option>
        </Select>
      </FormControl>
      <TextField
        label="説明文"
        name="description"
        defaultValue={attributes.description}
        multiline
        rows={4}
      />
      <TextField
        label="想定回答"
        name="source"
        defaultValue={attributes.source}
        multiline
        rows={6}
      />
      <Button type="submit" variant="contained">
        更新
      </Button>
    </Box>
  );
}
