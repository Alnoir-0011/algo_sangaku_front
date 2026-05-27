"use client";

import { Box, Button, TextField } from "@mui/material";
import { useRouter } from "next/navigation";
import type { AdminShrine } from "@/app/lib/definitions";
import { createShrine, updateShrine } from "@/app/lib/actions/admin";

interface Props {
  shrine?: AdminShrine;
}

export default function AdminShrineForm({ shrine }: Props) {
  const isEdit = !!shrine;
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const success = isEdit
      ? await updateShrine(shrine.id, formData)
      : await createShrine(formData);
    if (success) router.refresh();
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 480 }}
    >
      <TextField
        label="神社名"
        name="name"
        defaultValue={shrine?.attributes.name ?? ""}
        required
      />
      {!isEdit && (
        <>
          <TextField label="住所" name="address" required />
          <TextField
            label="緯度"
            name="latitude"
            type="number"
            inputProps={{ step: "any" }}
            required
          />
          <TextField
            label="経度"
            name="longitude"
            type="number"
            inputProps={{ step: "any" }}
            required
          />
          <TextField label="Place ID" name="place_id" required />
        </>
      )}
      <Button type="submit" variant="contained">
        {isEdit ? "更新" : "作成"}
      </Button>
    </Box>
  );
}
