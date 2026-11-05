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
  // 結果は、どの入力（source・fixedInputs）に対するものかと一緒に持つ。入力が変わると、
  // 結果は現在の入力のものではなくなるため、実行中として扱える。isLoading を別の state に
  // すると、effect の中で true に戻す更新が要り、余分な再レンダリングが起きる。
  const [state, setState] = useState<{
    source: string;
    fixedInputs: string[];
    results: string[];
  } | null>(null);

  useEffect(() => {
    // 入力が変わった後に、古い入力の実行が遅れて終わっても、結果を上書きしない
    let ignore = false;

    async function getResult() {
      let results: string[];
      try {
        results = await runSource(source, fixedInputs);
      } catch (error) {
        results = [
          error instanceof Error ? error.message : "実行できませんでした",
        ];
      }
      if (!ignore) {
        setState({ source, fixedInputs, results });
      }
    }

    getResult();

    return () => {
      ignore = true;
    };
  }, [source, fixedInputs]);

  const results =
    state?.source === source && state.fixedInputs === fixedInputs
      ? state.results
      : null;

  if (results === null) {
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
