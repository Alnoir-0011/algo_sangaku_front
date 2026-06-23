"use client";

import { useActionState, useState } from "react";
import { Editor } from "@monaco-editor/react";
import { generateSource, State } from "@/app/lib/actions/sangaku";
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
import type { Difficulty, GenerateSourceUsage } from "@/app/lib/definitions";
import GenerateSourceUsageIndicator from "@/app/ui/sangaku/generate-source-usage-indicator";

const DESCRIPTION_MAX_LENGTH = 2000;

type SangakuFormAction = (
  prevState: State,
  formData: FormData,
  source: string,
  difficulty: Difficulty,
  fixedInputs: string[],
  description: string,
) => Promise<State>;

interface Props {
  action: SangakuFormAction;
  initialState: State;
  initialSource: string;
  initialDescription: string;
  initialFixedInputs: string[];
  initialDifficulty: Difficulty;
  initialUsage: GenerateSourceUsage | undefined;
}

export default function SangakuForm({
  action,
  initialState,
  initialSource,
  initialDescription,
  initialFixedInputs,
  initialDifficulty,
  initialUsage,
}: Props) {
  const [source, setSource] = useState(initialSource);
  const [description, setDescription] = useState(initialDescription);
  const [fixedInputs, setFixedInputs] = useState(initialFixedInputs);
  const [difficulty, setDifficulty] = useState<Difficulty>(initialDifficulty);
  const [modalOpen, setModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [usage, setUsage] = useState<GenerateSourceUsage | undefined>(initialUsage);
  const [generateErrorMessage, setGenerateErrorMessage] = useState<
    string | undefined
  >(undefined);

  const [state, formAction] = useActionState(
    (prevState: State, formData: FormData) =>
      action(prevState, formData, source, difficulty, fixedInputs, description),
    initialState,
  );

  const handleEditorChange = (value: string | undefined) => {
    /* v8 ignore next */
    if (typeof value === "string") {
      setSource(value);
    }
  };

  const handleDifficultyChange = (event: SelectChangeEvent) => {
    setDifficulty(event.target.value as Difficulty);
  };

  const handleGenerate = async () => {
    /* v8 ignore next */
    if (!description.trim()) return;
    setIsGenerating(true);
    setGenerateErrorMessage(undefined);
    try {
      const result = await generateSource(description);
      if (result.source) setSource(result.source);
      if (result.usage) {
        setUsage(result.usage);
      } else if (result.errorMessage) {
        setUsage((prev) => (prev ? { ...prev, remaining: 0 } : prev));
      }
      if (result.errorMessage) setGenerateErrorMessage(result.errorMessage);
    } finally {
      setIsGenerating(false);
    }
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
                問題文は{DESCRIPTION_MAX_LENGTH}文字以内で入力してください（現在
                {description.length}文字）
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
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: 0.5,
                }}
              >
                <GenerateSourceUsageIndicator usage={usage} />
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleGenerate}
                  disabled={
                    isGenerating ||
                    !description.trim() ||
                    description.length > DESCRIPTION_MAX_LENGTH ||
                    usage?.remaining === 0
                  }
                  startIcon={
                    isGenerating ? <CircularProgress size={14} /> : undefined
                  }
                >
                  問題文からコードを生成
                </Button>
                {generateErrorMessage && (
                  <Typography
                    variant="caption"
                    sx={{ color: "error.main" }}
                    role="alert"
                    data-testid="generate-error-message"
                  >
                    {generateErrorMessage}
                  </Typography>
                )}
              </Box>
            </Box>
            <Box data-testid="monaco-editor-source">
              <Editor
                theme="vs-dark"
                height="60vh"
                width="100%"
                defaultLanguage="ruby"
                value={source}
                onChange={handleEditorChange}
              />
            </Box>
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
                <MenuItem value={"normal"}>普通</MenuItem>
                <MenuItem value={"difficult"}>難しい</MenuItem>
                <MenuItem value={"very_difficult"}>とても難しい</MenuItem>
              </Select>
            </FormControl>
            <Box>
              <Button
                variant="contained"
                onClick={() => setModalOpen(true)}
                sx={{ mr: 2, mt: 3 }}
              >
                確認画面へ
              </Button>
            </Box>
          </Box>
        </Grid>
      </Grid>
      <CheckPage
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        source={source}
        fixedInputs={fixedInputs}
      />
    </form>
  );
}
