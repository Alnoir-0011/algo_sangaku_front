import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { fetchUserAnswerResult } from "@/app/lib/data/answer";

interface Props {
  index: number;
  id: string;
}

export default async function Result({ index, id }: Props) {
  const result = await fetchUserAnswerResult(id);

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
