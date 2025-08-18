"use client";

import { useActionState, useState } from "react";
import { Editor } from "@monaco-editor/react";
import { updateSangaku, State } from "@/app/lib/actions/sangaku";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid2";
import FixedInputField from "@/app/ui/sangaku/FixedInputField";
import CheckPage from "@/app/ui/sangaku/CheckPage";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
} from "@mui/material";
import type { Sangaku, Difficulty } from "@/app/lib/definitions";

interface Props {
  sangaku: Sangaku;
}

export default function Form({ sangaku }: Props) {
  const initialState: State = {
    values: {
      title: sangaku.attributes.title,
      description: sangaku.attributes.description,
    },
  };
  const [state, formAction] = useActionState(updateSangakuAction, initialState);
  const [source, setSource] = useState(sangaku.attributes.source);
  const [fixedInputs, setFixedInputs] = useState(
    sangaku.attributes.inputs.map((input) => input.content),
  );
  const [difficulty, setDifficulty] = useState<Difficulty>(
    sangaku.attributes.difficulty,
  );
  const [modalOpen, setModalOpen] = useState(false);

  async function updateSangakuAction(prevState: State, formData: FormData) {
    const result = await updateSangaku(
      sangaku.id,
      prevState,
      formData,
      source,
      difficulty,
      fixedInputs,
    );
    return result;
  }

  const handleEditorChange = (value: string | undefined) => {
    if (typeof value === "string") {
      setSource(value);
    }
  };

  const handleDifficultyChange = (event: SelectChangeEvent) => {
    setDifficulty(event.target.value as Difficulty);
  };

  const openModal = () => {
    setModalOpen(true);
  };

  return (
    <form
      action={(formData) => {
        setModalOpen(false);
        formAction(formData);
      }}
      id="sangaku_form"
    >
      {state.message && (
        <Typography sx={{ color: "red" }}>{state.message}</Typography>
      )}
      <Grid
        container
        spacing={2}
        columns={{ xs: 6, md: 12 }}
        sx={{ width: "100%" }}
      >
        <Grid size={6}>
          <Box sx={{ mb: 1 }}>
            <label htmlFor="title">
              タイトル
              <TextField
                fullWidth
                id="title"
                variant="outlined"
                name="title"
                defaultValue={state.values?.title}
              />
            </label>
            {state.errors?.title &&
              state.errors.title.map((error: string) => (
                <Typography
                  aria-label="titleError"
                  key={error}
                  sx={{ color: "red" }}
                >
                  {error}
                </Typography>
              ))}
          </Box>
          <Box sx={{ mb: 1 }}>
            <label htmlFor="description">
              問題文
              <TextField
                multiline
                fullWidth
                id="description"
                variant="outlined"
                rows={15}
                name="description"
                defaultValue={state.values?.description}
              />
            </label>
            {state.errors?.description &&
              state.errors.description.map((error: string) => (
                <Typography
                  aria-label="descriptionError"
                  key={error}
                  sx={{ color: "red" }}
                >
                  {error}
                </Typography>
              ))}
          </Box>
          <Box sx={{ mb: 2 }}>
            解答チェック用入力
            <FixedInputField
              fixedInputs={fixedInputs}
              setFixedInputs={setFixedInputs}
            />
            {state.errors?.fixed_inputs &&
              state.errors.fixed_inputs.map((error: string) => (
                <Typography
                  aria-label="fixedInputsError"
                  key={error}
                  sx={{ color: "red" }}
                >
                  {error}
                </Typography>
              ))}
          </Box>
        </Grid>
        <Grid size={6}>
          <Box sx={{ mb: 2 }}>
            <label>
              ソースコード
              <Editor
                theme="vs-dark"
                height="60vh"
                width="100%"
                defaultLanguage="ruby"
                value={source}
                onChange={handleEditorChange}
              />
            </label>
            {state.errors?.source &&
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
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <FormControl>
              <InputLabel id="difficulty">難易度</InputLabel>
              <Select
                labelId="difficulty"
                value={difficulty}
                label="難易度"
                onChange={handleDifficultyChange}
              >
                <MenuItem value={"easy"}>簡単</MenuItem>
                <MenuItem value={"nomal"}>普通</MenuItem>
                <MenuItem value={"difficult"}>難しい</MenuItem>
                <MenuItem value={"very_difficult"}>とても難しい</MenuItem>
              </Select>
            </FormControl>
            <Box>
              <Button
                variant="contained"
                onClick={openModal}
                sx={{ mr: 2, mt: 3 }}
              >
                確認画面へ
              </Button>
            </Box>
          </Box>
        </Grid>
      </Grid>
      <CheckPage
        useModal={() => [modalOpen, setModalOpen]}
        source={source}
        fixedInputs={fixedInputs}
      />
    </form>
  );
}
