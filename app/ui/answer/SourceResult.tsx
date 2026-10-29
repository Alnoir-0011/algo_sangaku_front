"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { Answer } from "@/app/lib/definitions";
import { fetchUserAnswer } from "@/app/lib/data/answer";
import { useEffect, useState } from "react";
import { SourceResultLoading } from "./LoadingCirclars";

interface Props {
  answer: Answer;
}

const size = 240;

export default function SourceResult(props: Props) {
  const [answer, setAnswer] = useState(props.answer);

  const id = props.answer.id;
  const isLoading = answer.attributes.status === "pending";

  useEffect(() => {
    // 最初から正誤が確定している（status !== "pending"）場合は、既に確定した
    // 結果を表示するだけでよく、ポーリングする必要がない。ポーリングすると
    // 一瞬スピナーが表示されたうえ、無駄なリクエストが1回飛んでしまう。
    if (answer.attributes.status !== "pending") {
      return;
    }
    const interval = setInterval(async () => {
      const data = await fetchUserAnswer(id);
      if (data && data.attributes.status !== "pending") {
        setAnswer(data);
        clearInterval(interval);
      }
    }, 250);

    return () => clearInterval(interval);
  }, [id, answer.attributes.status]);

  const isCorrect = () => answer.attributes.status === "correct";

  if (isLoading) {
    return <SourceResultLoading />;
  }

  return (
    <Box sx={{ display: "flex", justifyContent: "center" }}>
      {isCorrect() && (
        <Box
          sx={{
            width: size,
            height: size,
            border: 3,
            borderRadius: "100%",
            m: 3,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            borderWidth: 4,
            borderColor: "#EB6101",
          }}
        >
          <Typography variant="h1" sx={{ color: "secondary.main" }}>
            明<br />察
          </Typography>
        </Box>
      )}
      {isCorrect() || (
        <Box
          sx={{
            width: size,
            height: size,
            border: 2,
            borderRadius: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            m: 3,
            borderWidth: 5,
            borderColor: "#016AEB",
          }}
        >
          <Typography variant="h1" sx={{ color: "#016AEB" }}>
            誤<br />謬
          </Typography>
        </Box>
      )}
    </Box>
  );
}
