"use client";

import { useState, useActionState } from "react";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid2";
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
} from "@mui/material";
import type { Difficulty, ReorderCodeBlockInput } from "@/app/lib/definitions";
import type { State } from "@/app/lib/actions/sangaku";
import MarkdownEditor from "@/app/ui/shared/MarkdownEditor";
import CodeBlockEditor from "@/app/ui/sangaku/reorder/CodeBlockEditor";
import type { CodeBlockDraft } from "@/app/ui/sangaku/reorder/CodeBlockEditor";
import ReorderCheckPage from "@/app/ui/sangaku/reorder/ReorderCheckPage";
import { assignCorrectPositions } from "@/app/ui/sangaku/reorder/codeBlockPosition";

// ReorderCheckPage の「保存する」ボタンは MUI Modal の Portal で document.body 直下
// （<form> の外）に描画されるため、native の親子関係では送信できない。HTML標準の
// form={formId} 属性（Button の form prop）で id 経由の紐付けを行う都合上、
// 固定文字列の id が必要になる。
// 現在の要件は1ページに1つの ReorderSangakuForm のみのため固定値で問題ないが、
// 将来同一ページに複数インスタンスを描画する要件が生じた場合はid重複を避けるため
// props経由で受け取れるようにする必要がある
const FORM_ID = "reorder_sangaku_form";

// action の codeBlocks は back へ送信するペイロード形状（ReorderCodeBlockInput。
// content + correct_position）で受け取る。CodeBlockEditor が扱う編集中の
// ドラフト形状（CodeBlockDraft。content + isDummy）とは別物で、
// ドラフト→ペイロードの変換は toReorderCodeBlockInputs で行う
//
// title のみ formData 経由（<input name="title">）で action に渡り、
// description/difficulty/codeBlocks は state 経由で明示的な引数として渡る。
// title は defaultValue の非制御入力のままでよく再制御化する理由がないため。
// SangakuForm.tsx も同じ非対称性を採用しており、本ファイルはそのパターンを踏襲する
type ReorderSangakuFormAction = (
  prevState: State,
  formData: FormData,
  difficulty: Difficulty,
  description: string,
  codeBlocks: ReorderCodeBlockInput[],
) => Promise<State>;

interface Props {
  action: ReorderSangakuFormAction;
  initialState: State;
  initialDescription: string;
  initialDifficulty: Difficulty;
  initialBlocks: CodeBlockDraft[];
}

interface FieldErrorProps {
  label: string;
  errors?: string[];
}

// title/description/difficulty で共通のエラー表示パターン（RED フェーズで3回重複していた）を
// このファイル内に閉じたヘルパーとして共通化する。
// SangakuForm.tsx にも同じ重複パターンがあるが、他ファイルの設計にまで踏み込むと
// 一貫性を崩すためスコープをこのファイル内に限定する。
function FieldError({ label, errors }: FieldErrorProps) {
  if (!errors) return null;

  return (
    <>
      {errors.map((error) => (
        <Typography aria-label={label} key={error} sx={{ color: "red" }}>
          {error}
        </Typography>
      ))}
    </>
  );
}

// CodeBlockDraft（isDummy）を ReorderCodeBlockInput（correct_position）に変換する。
// 連番の算出自体は ReorderCheckPage.tsx の表示ラベル算出と共通のため
// assignCorrectPositions に委譲し、ここでは送信ペイロード形状への変換のみを行う。
function toReorderCodeBlockInputs(
  blocks: CodeBlockDraft[],
): ReorderCodeBlockInput[] {
  const positions = assignCorrectPositions(blocks);
  return blocks.map((block, index) => ({
    content: block.content,
    correct_position: positions[index],
  }));
}

export default function ReorderSangakuForm({
  action,
  initialState,
  initialDescription,
  initialDifficulty,
  initialBlocks,
}: Props) {
  const [difficulty, setDifficulty] = useState<Difficulty>(initialDifficulty);
  const [description, setDescription] = useState(initialDescription);
  const [blocks, setBlocks] = useState(initialBlocks);
  const [checkPageOpen, setCheckPageOpen] = useState(false);

  const [state, formAction] = useActionState(
    (prevState: State, formData: FormData) =>
      action(
        prevState,
        formData,
        difficulty,
        description,
        toReorderCodeBlockInputs(blocks),
      ),
    initialState,
  );

  const handleDifficultyChange = (event: SelectChangeEvent) => {
    setDifficulty(event.target.value as Difficulty);
  };

  // back（ReorderSangaku#code_blocks_composition）は正解ブロック（isDummyでない
  // ブロック）が2個未満だと400を返す。ここで事前に検知し、無駄な送信と
  // ブロック0件のまま誤って保存してしまう事故（全ブロック削除の全置換）を防ぐ
  const correctBlockCount = blocks.filter((block) => !block.isDummy).length;
  const hasEnoughCorrectBlocks = correctBlockCount >= 2;
  // ブロックを1つも生成していない初期状態でいきなり警告を出すと、まだ何もしていない
  // ユーザーにエラーのような印象を与えてしまう。行分割等でブロックを生成し始めた後、
  // 2個未満のままである場合にのみ警告する。
  const shouldShowMinBlocksWarning =
    blocks.length > 0 && !hasEnoughCorrectBlocks;
  // isDummy の有無にかかわらず、content が空のブロックは back が汎用的な
  // エラーメッセージ（どのブロックが原因か分からない）で弾くため、事前に検知する。
  // 個々のブロックのエラー表示は CodeBlockEditor 側（TextField の error/helperText）で行う。
  const hasEmptyBlock = blocks.some((block) => block.content.trim() === "");
  const canProceedToCheckPage = hasEnoughCorrectBlocks && !hasEmptyBlock;

  return (
    <form
      action={(formData) => {
        setCheckPageOpen(false);
        formAction(formData);
      }}
      id={FORM_ID}
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
              {/* title は非制御入力（defaultValue）のため、mount 時点の値である
                  initialState を参照する。state（useActionState が管理する再送信後の
                  最新結果）を渡しても defaultValue の再代入は DOM に反映されず
                  誤解を招くため使わない。一方エラー表示は送信の都度更新される必要が
                  あるため state.errors を参照する（下の FieldError も同様） */}
              <TextField
                fullWidth
                variant="outlined"
                id="title"
                name="title"
                defaultValue={initialState.values?.title}
                sx={{ mt: 0.5 }}
              />
            </label>
            <FieldError label="titleError" errors={state.errors?.title} />
          </Box>
          <Box sx={{ mb: 1 }}>
            {/* SangakuForm.tsx の問題文欄と同じ MarkdownEditor を使い、
                同じ固定高さ（60vh）にする */}
            <MarkdownEditor
              label="問題文"
              value={description}
              onChange={setDescription}
              height="60vh"
            />
            <FieldError
              label="descriptionError"
              errors={state.errors?.description}
            />
          </Box>
        </Grid>
        <Grid size={6}>
          <Box sx={{ mb: 2 }}>
            <Box sx={{ mb: 0.5 }}>
              <Typography component="span">コードブロック</Typography>
            </Box>
            <CodeBlockEditor blocks={blocks} setBlocks={setBlocks} />
            <FieldError
              label="codeBlocksError"
              errors={state.errors?.code_blocks}
            />
            {shouldShowMinBlocksWarning && (
              <Typography
                aria-label="minCodeBlocksWarning"
                sx={{ color: "red", mt: 1 }}
              >
                正解ブロックを2個以上追加してください
              </Typography>
            )}
            {hasEmptyBlock && (
              <Typography
                aria-label="emptyCodeBlockWarning"
                sx={{ color: "red", mt: 1 }}
              >
                内容が空のブロックがあります
              </Typography>
            )}
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <FormControl sx={{ minWidth: 200 }}>
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
              <FieldError
                label="difficultyError"
                errors={state.errors?.difficulty}
              />
            </FormControl>
            <Box>
              <Button
                variant="contained"
                type="button"
                onClick={() => setCheckPageOpen(true)}
                disabled={!canProceedToCheckPage}
                sx={{ mr: 2, mt: 3 }}
              >
                確認画面へ
              </Button>
            </Box>
          </Box>
        </Grid>
      </Grid>
      <ReorderCheckPage
        open={checkPageOpen}
        onClose={() => setCheckPageOpen(false)}
        blocks={blocks}
        formId={FORM_ID}
      />
    </form>
  );
}
