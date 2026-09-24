"use client";

import Link from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import type { Kind } from "@/app/lib/definitions";

const KIND_OPTIONS: { kind: Kind; label: string }[] = [
  { kind: "code", label: "コード記述形式で作成" },
  { kind: "reorder", label: "並べ替え形式で作成" },
];

export default function KindSelector() {
  return (
    <Box sx={{ maxWidth: 400 }}>
      <Typography sx={{ mb: 2 }}>作成する問題の形式を選んでください</Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {KIND_OPTIONS.map(({ kind, label }) => (
          <Button
            key={kind}
            component={Link}
            href={`?kind=${kind}`}
            variant="outlined"
            size="large"
          >
            {label}
          </Button>
        ))}
      </Box>
    </Box>
  );
}
