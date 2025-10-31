"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { fetchUserAnswerResult } from "@/app/lib/data/answer";
import { useState, useEffect } from "react";
import { AnswerResult } from "@/app/lib/definitions";
import { ResultLoading } from "./LoadingCirclars";

interface Props {
  index: number;
  id: string;
}

export default function Result({ index, id }: Props) {
  const [result, setResult] = useState<AnswerResult | null | undefined>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const interval = setInterval(async () => {
      const data = await fetchUserAnswerResult(id);
      if (data && data.attributes.status !== "pending") {
        setResult(data);
        clearInterval(interval);
        setIsLoading(false);
      }
    }, 250);

    return () => clearInterval(interval);
  }, [id]);

  if (isLoading) {
    return <ResultLoading index={index} />;
  }
  return (
    <Box
      sx={{
        display: "flex",
        borderBottom: "1px solid gray",
      }}
    >
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
        <Typography aria-label={`result-${index + 1}`}>
          {result?.attributes.output}
        </Typography>
      </Box>
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        sx={{ p: 1, width: 50 }}
      >
        <Typography>
          {result?.attributes.status === "correct" ? "○" : "×"}
        </Typography>
      </Box>
    </Box>
  );
}
