import { runSource } from "@/app/lib/actions/sangaku";
import { CircularProgress } from "@mui/material";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";

interface Props {
  source: string;
  fixedInputs: string[];
}

export default function SourceResult({ source, fixedInputs }: Props) {
  const [results, setResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function getResult() {
      setIsLoading(true);
      try {
        const newResult = await runSource(source, fixedInputs);
        setResults(newResult);
      } catch (error) {
        setResults([error instanceof Error ? error.message : "実行できませんでした"]);
      } finally {
        setIsLoading(false);
      }
    }

    getResult();
  }, [source, fixedInputs]);

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
        }}
      >
        <CircularProgress size="16rem" color="info" />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        border: "1px solid black",
        borderRadius: 2,
        overflow: "hidden",
        width: "100%",
      }}
    >
      {results.map((value, index) => (
        <Box
          key={index}
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
          <Box sx={{ flexGrow: 1, p: 1 }}>
            <Typography aria-label={`result-${index + 1}`}>{value}</Typography>
          </Box>
        </Box>
      ))}
    </Box>
  );
}
