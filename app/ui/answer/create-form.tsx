"use client";

import { useState, useActionState } from "react";
import { Editor } from "@monaco-editor/react";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid2";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { Sangaku } from "@/app/lib/definitions";
import { createAnswer, State } from "@/app/lib/actions/answer";
import SourceExecution from "./SourceExecution";

interface Props {
  sangaku: Sangaku;
}

const initialSource = "# 対応言語: Ruby\ninput = gets.chomp\nputs input";
const initialState: State = { errors: {} };

export default function Form({ sangaku }: Props) {
  const [source, setSource] = useState(initialSource);
  const [state, formAction] = useActionState(postAnswerAction, initialState);

  const handleEditorChange = (value: string | undefined) => {
    if (typeof value === "string") {
      setSource(value);
    }
  };

  async function postAnswerAction() {
    if (window.confirm("解答を終了しますか？")) {
      const newState = await createAnswer(sangaku.id, source);
      return newState;
    }
  }

  return (
    <form action={formAction}>
      <Grid
        container
        spacing={2}
        columns={{ xs: 6, md: 12 }}
        sx={{ width: "100%" }}
      >
        <Grid size={6}>
          {/* タイトル */}
          <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
            {sangaku.attributes.title}
          </Typography>
          {/* 問題文 */}
          <Typography
            height="65vh"
            sx={{ p: 1, backgroundColor: "primary.main" }}
          >
            {sangaku.attributes.description}
          </Typography>
        </Grid>
        <Grid size={6}>
          {/* Editor */}
          <Box sx={{ mb: 2 }}>
            <Editor
              theme="vs-dark"
              height="60vh"
              width="100%"
              defaultLanguage="ruby"
              value={source}
              onChange={handleEditorChange}
            />
            {state?.errors?.source &&
              state.errors.source.map((error: string) => (
                <Typography
                  aria-label="sourceError"
                  key={error}
                  sx={{ color: "red" }}
                >
                  {error}
                </Typography>
              ))}
          </Box>
          {/* input output */}
          <SourceExecution source={source} />
          <Box display="flex" justifyContent="end">
            <Button variant="contained" type="submit">
              解答を終了する
            </Button>
          </Box>
        </Grid>
      </Grid>
    </form>
  );
}
