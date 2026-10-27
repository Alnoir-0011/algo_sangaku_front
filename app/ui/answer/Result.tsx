"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useState, useEffect } from "react";
import { AnswerResult } from "@/app/lib/definitions";
import { ResultLoading } from "./LoadingCirclars";

interface Props {
  index: number;
  id: string;
  /** テスト用: ポーリング間隔 ms（デフォルト 250） */
  pollInterval?: number;
  /** テスト用: 最大ポーリング回数（デフォルト 40 = 10秒） */
  maxPollCount?: number;
}

interface RowProps {
  index: number;
  output?: string;
  status?: string;
  isTimeout?: boolean;
}

function ResultRow({ index, output, status, isTimeout }: RowProps) {
  return (
    <Box sx={{ display: "flex", borderBottom: "1px solid gray" }}>
      <Box
        sx={{
          borderRight: "1px solid gray",
          width: 30,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: "bold",
        }}
      >
        {index + 1}
      </Box>
      <Box sx={{ flexGrow: 1, p: 1, borderRight: "1px solid gray" }}>
        <Typography
          color={isTimeout ? "error" : undefined}
          data-testid={`result-${index + 1}`}
        >
          {isTimeout ? "採点タイムアウト" : output}
        </Typography>
      </Box>
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        sx={{ p: 1, width: 50 }}
      >
        <Typography>{status === "correct" ? "○" : "×"}</Typography>
      </Box>
    </Box>
  );
}

export default function Result({
  index,
  id,
  pollInterval = 250,
  maxPollCount = 40,
}: Props) {
  const [settled, setSettled] = useState<{
    id: string;
    result?: AnswerResult;
    isTimeout: boolean;
  } | null>(null);

  useEffect(() => {
    let count = 0;
    let abortController: AbortController | null = null;

    const interval = setInterval(async () => {
      if (abortController) return;
      count++;
      if (count >= maxPollCount) {
        clearInterval(interval);
        setSettled({ id, isTimeout: true });
        return;
      }
      abortController = new AbortController();
      try {
        const res = await fetch(`/api/answer-results/${id}`, {
          signal: abortController.signal,
        });
        if (res.ok) {
          const json = await res.json();
          const data = json?.data as AnswerResult | undefined;
          if (data && data.attributes.status !== "pending") {
            clearInterval(interval);
            setSettled({ id, result: data, isTimeout: false });
          }
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
      } finally {
        abortController = null;
      }
    }, pollInterval);

    return () => {
      clearInterval(interval);
      abortController?.abort();
    };
  }, [id, pollInterval, maxPollCount]);

  if (settled?.id !== id) {
    return <ResultLoading index={index} />;
  }
  if (settled.isTimeout) {
    return <ResultRow index={index} isTimeout />;
  }
  return (
    <ResultRow
      index={index}
      output={settled.result?.attributes.output}
      status={settled.result?.attributes.status}
    />
  );
}
