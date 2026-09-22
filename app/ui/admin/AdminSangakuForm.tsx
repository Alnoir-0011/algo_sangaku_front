"use client";

import {
  Box,
  Button,
  FormControl,
  InputLabel,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type {
  AdminSangaku,
  CodeBlock,
  ReorderCodeBlockInput,
} from "@/app/lib/definitions";
import { updateSangaku } from "@/app/lib/actions/admin";
import CodeBlockEditor, {
  type CodeBlockDraft,
} from "@/app/ui/sangaku/reorder/CodeBlockEditor";
import { assignCorrectPositions } from "@/app/ui/sangaku/reorder/codeBlockPosition";

interface Props {
  sangaku: AdminSangaku;
}

// CodeBlock（back から取得した永続化済みブロック）を CodeBlockEditor が扱う
// CodeBlockDraft に変換する。EditReorderForm.tsx の toCodeBlockDrafts と同様の考え方。
function toCodeBlockDrafts(codeBlocks: CodeBlock[]): CodeBlockDraft[] {
  return codeBlocks.map((block) => ({
    content: block.content,
    isDummy:
      block.correct_position === null || block.correct_position === undefined,
  }));
}

// CodeBlockDraft（isDummy）を updateSangaku に渡す codeBlocks 形状に変換する。
// 連番の割り当ては ReorderSangakuForm.tsx の toReorderCodeBlockInputs と同じ
// assignCorrectPositions を共有し、ロジックの重複を避ける。
function toAdminCodeBlockInputs(
  blocks: CodeBlockDraft[],
): ReorderCodeBlockInput[] {
  const positions = assignCorrectPositions(blocks);
  return blocks.map((block, index) => ({
    content: block.content,
    correct_position: positions[index],
  }));
}

export default function AdminSangakuForm({ sangaku }: Props) {
  const { id, attributes } = sangaku;
  const router = useRouter();
  const isReorderKind = attributes.kind === "reorder";
  const [blocks, setBlocks] = useState<CodeBlockDraft[]>(
    toCodeBlockDrafts(attributes.code_blocks ?? []),
  );

  // ReorderSangakuForm.tsx と同じ制約（back の
  // ReorderSangaku#code_blocks_composition が正解ブロック2個未満・空ブロックを
  // 400 で弾く）をここでも事前に検知する。クライアント側にガードが無いと、
  // 送信後に汎用的な「リクエストに失敗しました」しか出せず原因が分からない。
  const correctBlockCount = blocks.filter((block) => !block.isDummy).length;
  const hasEnoughCorrectBlocks = correctBlockCount >= 2;
  const hasEmptyBlock = blocks.some((block) => block.content.trim() === "");
  const canSubmitReorderBlocks =
    !isReorderKind || (hasEnoughCorrectBlocks && !hasEmptyBlock);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const success = isReorderKind
      ? await updateSangaku(id, formData, toAdminCodeBlockInputs(blocks))
      : await updateSangaku(id, formData);
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
      {isReorderKind ? (
        <>
          <CodeBlockEditor blocks={blocks} setBlocks={setBlocks} />
          {!hasEnoughCorrectBlocks && (
            <Typography aria-label="minCodeBlocksWarning" color="error">
              正解ブロックを2個以上追加してください
            </Typography>
          )}
          {hasEmptyBlock && (
            <Typography aria-label="emptyCodeBlockWarning" color="error">
              内容が空のブロックがあります
            </Typography>
          )}
        </>
      ) : (
        <TextField
          label="想定回答"
          name="source"
          defaultValue={attributes.source}
          multiline
          rows={6}
        />
      )}
      <Button
        type="submit"
        variant="contained"
        disabled={!canSubmitReorderBlocks}
      >
        更新
      </Button>
    </Box>
  );
}
