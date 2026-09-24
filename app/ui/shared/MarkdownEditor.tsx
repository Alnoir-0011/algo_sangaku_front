"use client";

import { useState, useId, KeyboardEvent } from "react";
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

// Tab キーで挿入するインデント幅。タブ文字はレンダリング環境によって幅が
// 変わりうるため、見た目が一定になる半角スペースを使う。
const INDENT = "  ";

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

  // ブラウザ標準では Tab キーは次のフォーカス可能要素への移動に使われ、
  // textarea 内にインデントを入力できない。ここでデフォルト動作を止めて
  // カーソル位置に半角スペースを挿入する。
  // document.execCommand("insertText") を使うことで、ブラウザ本来のテキスト
  // 挿入・カーソル移動・undo履歴の仕組みにそのまま乗せる。value を直接
  // 組み立てて setSelectionRange でカーソル位置を復元する自前実装は、
  // controlled component の再レンダリングとカーソル位置更新のタイミングが
  // 競合し、意図しない値になる問題があったため採用していない。
  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Tab" || e.shiftKey) return;
    e.preventDefault();
    document.execCommand("insertText", false, INDENT);
  }

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
          onKeyDown={handleKeyDown}
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
