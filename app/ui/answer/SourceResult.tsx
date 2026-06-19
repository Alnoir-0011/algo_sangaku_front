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
  const [isLoading, setIsLoading] = useState(false);

  const id = props.answer.id;

  useEffect(() => {
    setIsLoading(true);
    const interval = setInterval(async () => {
      const data = await fetchUserAnswer(id);
      if (data && data.attributes.status !== "pending") {
        setAnswer(data);
        clearInterval(interval);
        setIsLoading(false);
      }
    }, 250);

    return () => clearInterval(interval);
  }, [id]);

  const isCorrect = () => answer.attributes.status === "correct";

  if (isLoading) {
    return <SourceResultLoading />;
  }

  return (
    <Box display="flex" justifyContent="center">
      {isCorrect() && (
        <Box
          width={size}
          height={size}
          border={3}
          borderRadius="100%"
          m={3}
          display="flex"
          justifyContent="center"
          alignItems="center"
          sx={{ borderWidth: 4, borderColor: "#EB6101" }}
        >
          <Typography variant="h1" color="secondary.main">
            明<br />察
          </Typography>
        </Box>
      )}
      {isCorrect() || (
        <Box
          width={size}
          height={size}
          border={2}
          borderRadius="100%"
          display="flex"
          justifyContent="center"
          alignItems="center"
          m={3}
          sx={{ borderWidth: 5, borderColor: "#016AEB" }}
        >
          <Typography variant="h1" color="#016AEB">
            誤<br />謬
          </Typography>
        </Box>
      )}
    </Box>
  );
}
