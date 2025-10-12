import { useState } from "react";
import { runSource } from "@/app/lib/actions/sangaku";
import { Box, Button, CircularProgress, TextField } from "@mui/material";
import Grid from "@mui/material/Grid2";

const initialOutput = "出力がこちらに表示されます。";

interface Props {
  source: string;
}

export default function SourceExecution({ source }: Props) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState(initialOutput);
  const [isLoading, setIsLoading] = useState(false);

  const handleRunSource = async () => {
    setIsLoading(true);
    const result = await runSource(source, [input]);
    setOutput(result[0]);
    setIsLoading(false);
  };

  return (
    <>
      <Box display="flex" justifyContent="end">
        <Button variant="contained" onClick={handleRunSource} sx={{ mb: 1 }}>
          実行
        </Button>
      </Box>
      <Grid container spacing={1} sx={{ mb: 2 }}>
        <Grid size={6}>
          <TextField
            fullWidth
            multiline
            label="入力"
            value={input}
            rows={3}
            onChange={(e) => {
              setInput(e.target.value);
            }}
          />
        </Grid>
        <Grid
          size={6}
          justifyContent="center"
          alignItems="center"
          alignContent="center"
        >
          {isLoading || (
            <TextField
              fullWidth
              multiline
              label="出力"
              value={output}
              rows={3}
              slotProps={{
                input: {
                  readOnly: true,
                },
              }}
              aria-readonly={true}
            />
          )}
          {isLoading && (
            <CircularProgress
              size="4rem"
              sx={{ display: "block", m: "auto" }}
            />
          )}
        </Grid>
      </Grid>
    </>
  );
}
