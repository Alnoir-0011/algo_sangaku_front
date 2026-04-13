"use client";

import { useState, useId } from "react";
import Box from "@mui/material/Box";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import MarkdownPreview from "./MarkdownPreview";

interface Props {
  value: string;
  onChange: (value: string) => void;
  height?: string;
  label?: string;
}

export default function MarkdownEditor({
  value,
  onChange,
  height = "22.5rem",
  label,
}: Props) {
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const inputId = useId();

  const panelSx = {
    height,
    overflowY: "auto",
  } as const;

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 0.5,
        }}
      >
        {label && (
          <Typography component="label" htmlFor={inputId}>
            {label}
          </Typography>
        )}
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={(_, newMode) => {
            if (newMode !== null) setMode(newMode);
          }}
          size="small"
          aria-label="表示モード切替"
          sx={{ ml: "auto" }}
        >
          <ToggleButton value="edit" aria-label="編集">
            編集
          </ToggleButton>
          <ToggleButton value="preview" aria-label="プレビュー">
            プレビュー
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {mode === "edit" ? (
        <TextField
          id={inputId}
          multiline
          fullWidth
          variant="outlined"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="マークダウン記法で記述できます"
          sx={{
            "& .MuiInputBase-root": {
              ...panelSx,
              alignItems: "flex-start",
            },
            "& .MuiInputBase-input": {
              height: "100% !important",
              overflowY: "auto !important",
              boxSizing: "border-box",
            },
          }}
        />
      ) : (
        <Box
          sx={{
            ...panelSx,
            border: 1,
            borderColor: "rgba(0,0,0,0.23)",
            borderRadius: "4px",
            p: 1,
          }}
        >
          {value ? (
            <MarkdownPreview content={value} />
          ) : (
            <Box sx={{ color: "text.secondary", fontStyle: "italic" }}>
              プレビューが表示されます
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
