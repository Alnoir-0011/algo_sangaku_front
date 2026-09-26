"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Link from "next/link";
import { useState } from "react";

import {
  GuestAnswerResult,
  submitGuestReorderAnswer,
} from "@/app/lib/actions/guest_answer";
import { PuzzleBlock } from "@/app/lib/definitions";
import ReorderPuzzle from "@/app/ui/sangaku/reorder/ReorderPuzzle";
import { signinPath } from "@/routes";

interface Props {
  sangakuId: string;
  blocks: PuzzleBlock[];
  title: string;
  description: string;
  isLoggedIn: boolean;
}

export default function GuestReorderPuzzle({
  sangakuId,
  blocks,
  title,
  description,
  isLoggedIn,
}: Props) {
  const [result, setResult] = useState<GuestAnswerResult | null>(null);

  async function handleSubmit(blockIds: number[]) {
    setResult(await submitGuestReorderAnswer(sangakuId, blockIds));
  }

  function renderResult(current: GuestAnswerResult) {
    if ("error" in current) {
      return (
        <Alert severity="error" role="alert">
          {current.error}
        </Alert>
      );
    }

    if (current.status === "incorrect") {
      return (
        <Alert severity="warning" role="status">
          不正解です
        </Alert>
      );
    }

    if (current.status === "correct") {
      return (
        <Stack spacing={1}>
          <Alert severity="success" role="status">
            正解です！
          </Alert>
          {!isLoggedIn && (
            <Box display="flex" justifyContent="end">
              <Button component={Link} href={signinPath} variant="contained">
                サインインして他の算額も解く
              </Button>
            </Box>
          )}
        </Stack>
      );
    }

    return null;
  }

  return (
    <Stack spacing={2} sx={{ width: "100%" }}>
      <ReorderPuzzle
        sangakuId={sangakuId}
        blocks={blocks}
        title={title}
        description={description}
        onSubmit={handleSubmit}
        locked={result !== null && !("error" in result)}
      />
      {result && renderResult(result)}
    </Stack>
  );
}
