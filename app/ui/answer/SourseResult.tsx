import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { Answer } from "@/app/lib/definitions";
import { fetchUserAnswer } from "@/app/lib/data/answer";

interface Props {
  answer: Answer;
}

const size = 240;

export default async function SourceResult({ answer }: Props) {
  let data = answer;
  if (answer.attributes.status === "pending") {
    const ResultData = await fetchUserAnswer(answer.id);
    if (ResultData) {
      data = ResultData;
    }
  }

  const isCorrect = data.attributes.status === "correct";

  return (
    <Box display="flex" justifyContent="center">
      {isCorrect && (
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
      {isCorrect || (
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
