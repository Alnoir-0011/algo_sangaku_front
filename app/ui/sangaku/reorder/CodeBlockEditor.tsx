"use client";

import { Editor } from "@monaco-editor/react";
import AddIcon from "@mui/icons-material/Add";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import CallSplitIcon from "@mui/icons-material/CallSplit";
import CloseIcon from "@mui/icons-material/Close";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import { Dispatch, SetStateAction, useState } from "react";

export type CodeBlockDraft = { content: string; isDummy: boolean };

interface Props {
  blocks: CodeBlockDraft[];
  setBlocks: Dispatch<SetStateAction<CodeBlockDraft[]>>;
}

// 複数行テキストを改行で分割し、空行（空白のみの行を含む）を除去して
// CodeBlockDraft の配列に変換する。Monaco Editor の自動インデントにより
// 改行直前の行末に意図しない空白が付与されることがあるため、行末の空白は
// 除去する。先頭のインデントはコードの見た目として意味を持ちうるため保持する。
export function splitRawTextIntoBlocks(rawText: string): CodeBlockDraft[] {
  return rawText
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => ({ content: line.trimEnd(), isDummy: false }));
}

// 指定 index のブロックを取り除いた新しい配列を返す。
function removeBlockAt(
  blocks: CodeBlockDraft[],
  index: number,
): CodeBlockDraft[] {
  return blocks.filter((_, i) => i !== index);
}

// 指定 index のブロックとその次のブロックを1つに結合した新しい配列を返す。
// splitRawTextIntoBlocks が改行で分割した行を、逆に改行区切りでつなぎ直す操作にあたる。
// isDummy は常に false にはせず、結合する2ブロックのどちらかがダミーなら結合結果も
// ダミーとして扱う（安全側に倒す）。isDummy: false 固定だと、ダミーブロックを
// 分割・結合しただけで出題者が気づかないまま正解ブロックへ格上げされてしまう
// （quick-review 指摘）。
function mergeBlockWithNext(
  blocks: CodeBlockDraft[],
  index: number,
): CodeBlockDraft[] {
  const merged: CodeBlockDraft = {
    content: blocks[index].content + "\n" + blocks[index + 1].content,
    isDummy: blocks[index].isDummy || blocks[index + 1].isDummy,
  };
  return [...blocks.slice(0, index), merged, ...blocks.slice(index + 2)];
}

// 指定 index のブロックを改行位置で複数のブロックに分割した新しい配列を返す。
// mergeBlockWithNext とは逆に、1ブロックの content を改行で区切って
// 個別の CodeBlockDraft に展開する操作にあたる。
// 分割後の全ブロックは元ブロックの isDummy をそのまま引き継ぐ（isDummy: false
// 固定だと、ダミーブロックを分割しただけで正解ブロックへ格上げされてしまう）。
function splitBlockAt(
  blocks: CodeBlockDraft[],
  index: number,
): CodeBlockDraft[] {
  const { isDummy } = blocks[index];
  const splitBlocks: CodeBlockDraft[] = blocks[index].content
    .split("\n")
    .map((line) => ({ content: line, isDummy }));
  return [
    ...blocks.slice(0, index),
    ...splitBlocks,
    ...blocks.slice(index + 1),
  ];
}

// 空内容・isDummy: true のブロックを末尾に追加した新しい配列を返す。
function addDummyBlock(blocks: CodeBlockDraft[]): CodeBlockDraft[] {
  return [...blocks, { content: "", isDummy: true }];
}

// 配列内の2つのインデックスの要素を入れ替えた新しい配列を返す。
// moveBlockUpAt/moveBlockDownAt はどちらも「隣接する要素を入れ替える」という
// 同じ操作のため、コピー＋入れ替えのロジックをここに共通化する
// （ReorderPuzzle.tsx の swapAdjacentIds と同じ考え方）。
function swapAdjacentBlocks(
  blocks: CodeBlockDraft[],
  indexA: number,
  indexB: number,
): CodeBlockDraft[] {
  const result = [...blocks];
  [result[indexA], result[indexB]] = [result[indexB], result[indexA]];
  return result;
}

// 指定 index のブロックを1つ前の位置と入れ替えた新しい配列を返す。
// 並べ替え自体は addDummyBlock が常に末尾へ追加すること（ダミーブロックを
// 正解ブロックの間に配置する典型的な出題が作れない制約）を補うために設ける。
function moveBlockUpAt(
  blocks: CodeBlockDraft[],
  index: number,
): CodeBlockDraft[] {
  if (index <= 0) return blocks;
  return swapAdjacentBlocks(blocks, index - 1, index);
}

// 指定 index のブロックを1つ後ろの位置と入れ替えた新しい配列を返す。
function moveBlockDownAt(
  blocks: CodeBlockDraft[],
  index: number,
): CodeBlockDraft[] {
  if (index >= blocks.length - 1) return blocks;
  return swapAdjacentBlocks(blocks, index, index + 1);
}

export default function CodeBlockEditor({ blocks, setBlocks }: Props) {
  // 生成後は blocks.length > 0 となり入力欄自体が非表示になるため、
  // rawText を生成後も保持する必要はない（意図的にリセットしていない＝そのままで問題ない）。
  const [rawText, setRawText] = useState("");

  // コードブロック欄は「説明文」ではなく SangakuForm.tsx の「ソースコード」欄
  // （Monaco Editor, height="60vh"）に相当するため、同じ高さに合わせる。
  // 行数ベースの minRows / 際限のない伸びは、ページ全体の縦スクロールや
  // 列間の余白差を生むため使わず、常にこの高さの中に収める。
  const CODE_BLOCK_AREA_HEIGHT = "55vh";

  if (blocks.length === 0) {
    return (
      <Box>
        {/* 分割前のコード入力は SangakuForm.tsx のソースコード欄と同じ Monaco Editor
            にする。data-testid は複数 Monaco Editor が同一ページに存在する場合に
            区別するための識別子（SangakuForm.tsx の "monaco-editor-source" 相当） */}
        <Box data-testid="monaco-editor-block-input" sx={{ mb: 1 }}>
          <Editor
            theme="vs-dark"
            height={CODE_BLOCK_AREA_HEIGHT}
            defaultLanguage="ruby"
            value={rawText}
            onChange={(value) => setRawText(value ?? "")}
          />
        </Box>
        <Button
          variant="contained"
          onClick={() => setBlocks(splitRawTextIntoBlocks(rawText))}
        >
          行分割して生成
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Stack
        spacing={1.5}
        sx={{ mb: 1, height: CODE_BLOCK_AREA_HEIGHT, overflowY: "auto" }}
      >
        {blocks.map((block, index) => {
          // 空ブロック（isDummy の有無にかかわらず content が空）のまま送信すると、
          // back（ReorderSangaku#code_blocks_composition）が400を返すが、その
          // メッセージは汎用的でどのブロックが原因か分からない。ここでブロックごとに
          // エラー表示することで、送信前にどのブロックが空かをユーザーに示す。
          const isEmpty = block.content.trim() === "";
          return (
            // 結合ボタンをブロックとブロックの間（Paper の下端）に浮かせて配置する
            // ための位置決めコンテキスト。ボタン自体は Paper の兄弟として配置し、
            // Paper の内側（textarea）には重ねない。
            <Box key={index} sx={{ position: "relative" }}>
              <Paper
                variant="outlined"
                sx={{
                  p: 1.5,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 1,
                }}
              >
                <TextField
                  fullWidth
                  variant="outlined"
                  size="small"
                  // 画面には表示しないアクセシブルネーム。テストが getByLabel で
                  // 個々のブロックを識別するための識別子で、可視ラベルとしては
                  // 表示しない（block-content-{index} という技術的な文字列が
                  // 画面に見えてしまうのを避けるため label ではなく aria-label にする）。
                  slotProps={{
                    htmlInput: { "aria-label": `block-content-${index}` },
                  }}
                  // 結合操作でブロック内容に改行が入り得るため multiline にする
                  // （単一行 <input> は改行を保持・表示できない）
                  multiline
                  minRows={2}
                  value={block.content}
                  error={isEmpty}
                  helperText={isEmpty ? "内容を入力してください" : undefined}
                  onChange={(e) => {
                    // 対象インデックスのみ content を更新する。
                    // 更新パターンが増える（削除・結合・分割など）まではこの1箇所のみで、
                    // 共通関数への抽出は時期尚早と判断し見送る。
                    const newBlocks = blocks.map((b, i) =>
                      i === index ? { ...b, content: e.target.value } : b,
                    );
                    setBlocks(newBlocks);
                  }}
                />
                <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
                  <Tooltip title="上へ">
                    <span>
                      <IconButton
                        aria-label="上へ"
                        size="small"
                        disabled={index === 0}
                        onClick={() => setBlocks(moveBlockUpAt(blocks, index))}
                      >
                        <ArrowUpwardIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="下へ">
                    <span>
                      <IconButton
                        aria-label="下へ"
                        size="small"
                        disabled={index === blocks.length - 1}
                        onClick={() =>
                          setBlocks(moveBlockDownAt(blocks, index))
                        }
                      >
                        <ArrowDownwardIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="このブロックを削除">
                    <IconButton
                      aria-label="削除"
                      size="small"
                      onClick={() => setBlocks(removeBlockAt(blocks, index))}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="改行位置で分割">
                    <IconButton
                      aria-label="分割"
                      size="small"
                      onClick={() => setBlocks(splitBlockAt(blocks, index))}
                    >
                      <CallSplitIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Paper>
              {index < blocks.length - 1 && (
                <Tooltip title="次のブロックと結合">
                  <IconButton
                    aria-label="次と結合"
                    size="small"
                    onClick={() => setBlocks(mergeBlockWithNext(blocks, index))}
                    sx={{
                      position: "absolute",
                      // ブロック間の隙間（親 Stack の spacing={1.5} = 12px）の
                      // ちょうど中央にボタンの中心が来るよう、Paper の下端から
                      // 隙間の半分（6px）だけ下にずらした位置を基準にする。
                      // そこからさらにボタン自身の高さの半分だけ下へずらすことで、
                      // 上半分が上のブロックの .MuiPaper-root の padding に、
                      // 下半分が下のブロックの padding に重なり、両ブロックの
                      // 枠線のちょうど中央に浮いているように見える。
                      bottom: "-6px",
                      left: "50%",
                      transform: "translate(-50%, 50%)",
                      zIndex: 1,
                      bgcolor: "background.paper",
                      border: 1,
                      borderColor: "divider",
                      // action.hover は半透明のため、下に重なる枠線が透けて
                      // 見えてしまう。不透明な色を指定して透けを防ぐ。
                      "&:hover": { bgcolor: "grey.200" },
                    }}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          );
        })}
      </Stack>
      <Button
        variant="outlined"
        onClick={() => setBlocks(addDummyBlock(blocks))}
      >
        ダミーブロックを追加
      </Button>
    </Box>
  );
}
