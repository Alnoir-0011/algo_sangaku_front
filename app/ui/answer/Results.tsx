import Box from "@mui/material/Box";
import Result from "./Result";
import { Answer } from "@/app/lib/definitions";
import { Typography } from "@mui/material";

interface Props {
  answer: Answer;
}

export default function Results({ answer }: Props) {
  const resultIds = answer.relationships.answer_results.data.map(
    (result) => result.id,
  );

  return (
    <Box
      sx={{
        border: "1px solid black",
        borderRadius: 2,
        overflow: "hidden",
        width: "100%",
      }}
    >
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
            py: 0.5,
          }}
        />
        <Box
          display="flex"
          justifyContent="center"
          alignItems="end"
          sx={{ flexGrow: 1, p: 1, borderRight: "1px solid gray", py: 0.5 }}
        >
          <Typography>出力</Typography>
        </Box>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          sx={{ py: 0.5, width: 50 }}
        >
          <Typography>結果</Typography>
        </Box>
      </Box>
      {resultIds.map((value, index) => (
        <Result key={index} index={index} id={value} />
      ))}
    </Box>
  );
}
