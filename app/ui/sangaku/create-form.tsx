"use client";

import { useActionState, useState } from "react";
import { Editor } from "@monaco-editor/react";
import {
  createSangaku,
  generateSource,
  State,
} from "@/app/lib/actions/sangaku";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid2";
import FixedInputField from "@/app/ui/sangaku/FixedInputField";
import CheckPage from "@/app/ui/sangaku/CheckPage";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import MarkdownEditor from "@/app/ui/shared/MarkdownEditor";
import CircularProgress from "@mui/material/CircularProgress";
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
} from "@mui/material";
import type { Difficulty } from "@/app/lib/definitions";

const initialState: State = { errors: {} };
const initialSource = "# 対応言語: Ruby\ninput = gets.chomp\nputs input";
const DESCRIPTION_MAX_LENGTH = 2000;

export default function Page() {
  const [state, formAction] = useActionState(postSangakuAction, initialState);
  const [source, setSource] = useState(initialSource);
  const [description, setDescription] = useState("");
  const [fixedInputs, setFixedInputs] = useState([""]);
  const [difficulty, setDifficulty] = useState<Difficulty>("nomal");
  const [modalOpen, setModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  async function postSangakuAction(prevState: State, formData: FormData) {
    const result = await createSangaku(
      prevState,
      formData,
      source,
      difficulty,
      fixedInputs,
      description,
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

  const handleGenerate = async () => {
    if (!description.trim()) return;
    setIsGenerating(true);
    const generated = await generateSource(description);
    if (generated) {
      setSource(generated);
    }
    setIsGenerating(false);
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
            <MarkdownEditor
              label="問題文"
              value={description}
              onChange={setDescription}
            />
            {description.length > DESCRIPTION_MAX_LENGTH && (
              <Typography sx={{ color: "red" }}>
                問題文は{DESCRIPTION_MAX_LENGTH}文字以内で入力してください（現在{description.length}文字）
              </Typography>
            )}
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
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 0.5,
              }}
            >
              <Typography component="span">ソースコード</Typography>
              <Button
                variant="contained"
                size="small"
                onClick={handleGenerate}
                disabled={isGenerating || !description.trim() || description.length > DESCRIPTION_MAX_LENGTH}
                startIcon={
                  isGenerating ? <CircularProgress size={14} /> : undefined
                }
              >
                問題文からコードを生成
              </Button>
            </Box>
            <Editor
              theme="vs-dark"
              height="60vh"
              width="100%"
              defaultLanguage="ruby"
              value={source}
              onChange={handleEditorChange}
            />
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
