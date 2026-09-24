"use client";

import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  KeyboardSensor,
  PointerSensor,
  UniqueIdentifier,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid2";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { ReactNode, useMemo, useState } from "react";

import { PuzzleBlock } from "@/app/lib/definitions";
import { createAnswer } from "@/app/lib/actions/answer";
import MarkdownPreview from "@/app/ui/shared/MarkdownPreview";

// unused-blocks-area / answer-blocks-area の droppable id。
// SortableContext の items（ブロック id）と区別するため文字列 id を使う。
const UNUSED_AREA_ID = "unused-area";
const ANSWER_AREA_ID = "answer-area";

interface Props {
  sangakuId: string;
  blocks: PuzzleBlock[];
  title: string;
  description: string;
}

// 解答エリアへ移動するボタンの文言。Tooltip の title と IconButton の
// aria-label で同じ文言を共有するため定数化する。
const MOVE_TO_ANSWER_LABEL = "解答エリアへ移動";
// 利用しないエリアへ戻すボタンの文言。MOVE_TO_ANSWER_LABEL と対称的に定数化する。
const RETURN_TO_UNUSED_LABEL = "利用しないエリアへ戻す";
// 解答エリア内での並べ替えボタンの文言。
const MOVE_UP_LABEL = "上へ";
const MOVE_DOWN_LABEL = "下へ";

// 指定 id のブロックを取り除いた新しい配列を返す。
// CodeBlockEditor.tsx の removeBlockAt 等と同様、状態更新は
// 「元の配列と変更内容から新しい配列を作る純粋関数」に切り出す。
function removeBlockId(blockIds: number[], id: number): number[] {
  return blockIds.filter((blockId) => blockId !== id);
}

// 指定 id のブロックを配列の末尾に追加した新しい配列を返す。
// 既に含まれていれば何もしない。dnd-kit の onDragOver は同一ドラッグ操作中に
// 複数回発火しうるため、再レンダリング前に立て続けに呼ばれると同じ id が
// 2回追加されてしまう（back はブロック数の不整合を400で弾くが、原因が
// 分かりにくい）。このガードで重複追加を防ぐ。
// ボタン操作（「解答エリアへ移動」等）は挿入位置の指定余地がないため常に末尾でよい。
function appendBlockId(blockIds: number[], id: number): number[] {
  if (blockIds.includes(id)) return blockIds;
  return [...blockIds, id];
}

// 指定 id のブロックを、targetId の位置（targetId が見つからなければ末尾）に
// 挿入した新しい配列を返す。既に含まれていれば何もしない（appendBlockId と同じ理由）。
// D&D でのコンテナ間移動時、ドロップ先が特定のブロックの上であればその位置に、
// コンテナの余白（targetId が見つからない）であれば末尾に挿入する。
function insertBlockIdBefore(
  blockIds: number[],
  id: number,
  targetId: number,
): number[] {
  if (blockIds.includes(id)) return blockIds;
  const targetIndex = blockIds.indexOf(targetId);
  if (targetIndex === -1) {
    return [...blockIds, id];
  }
  return [
    ...blockIds.slice(0, targetIndex),
    id,
    ...blockIds.slice(targetIndex),
  ];
}

// 配列内の2つのインデックスの要素を入れ替えた新しい配列を返す。
// moveBlockUp/moveBlockDown はどちらも「隣接する要素を入れ替える」という
// 同じ操作のため、コピー＋入れ替えのロジックをここに共通化する。
function swapAdjacentIds(
  blockIds: number[],
  indexA: number,
  indexB: number,
): number[] {
  const result = [...blockIds];
  [result[indexA], result[indexB]] = [result[indexB], result[indexA]];
  return result;
}

// 指定 id のブロックを1つ前の位置と入れ替えた新しい配列を返す。
function moveBlockUp(blockIds: number[], id: number): number[] {
  const index = blockIds.indexOf(id);
  if (index <= 0) {
    return blockIds;
  }
  return swapAdjacentIds(blockIds, index - 1, index);
}

// 指定 id のブロックを1つ後ろの位置と入れ替えた新しい配列を返す。
function moveBlockDown(blockIds: number[], id: number): number[] {
  const index = blockIds.indexOf(id);
  if (index === -1 || index >= blockIds.length - 1) {
    return blockIds;
  }
  return swapAdjacentIds(blockIds, index, index + 1);
}

// id がエリア自体を表す droppable id（UNUSED_AREA_ID / ANSWER_AREA_ID）かどうかを
// 判定する。dnd-kit の over.id は「個々のブロック id」と「コンテナ自体の id」の
// どちらも取りうるため、asBlockId に渡す前にこの関数で区別する。
function isContainerId(id: UniqueIdentifier): boolean {
  return id === UNUSED_AREA_ID || id === ANSWER_AREA_ID;
}

// isContainerId で false と判定済みの id を number（ブロック id）として扱うための
// 意図的なキャスト。UniqueIdentifier（dnd-kit 定義の string | number）から number への
// キャストであることを名前で示すため、呼び出し側で `as number` を直接書かずこの
// 関数に集約する。呼び出し側は必ず isContainerId でコンテナ id を弾いてから使うこと
// （弾かずに渡すと文字列が number として扱われ、indexOf が常に -1 を返す）。
function asBlockId(id: UniqueIdentifier): number {
  return id as number;
}

interface BlockListItemProps {
  id: number;
  content: string;
  // アクションボタン群。unused エリアは「解答エリアへ移動」の1つのみ、
  // answer エリアは「上へ」「下へ」「利用しないエリアへ戻す」の3つと、
  // エリアごとにボタンの数・種類が異なるため、固定の props にせず
  // ReactNode として自由な数・種類を渡せるようにする。
  actions: ReactNode;
}

// unused-blocks-area / answer-blocks-area 共通のブロック1行分の見た目。
// 「ブロック内容を表示し、右側に可変長のアクションボタン群を配置する」という
// レイアウトの重複を吸収する。
// ドラッグ操作は独立したハンドル（data-testid="drag-handle"）にのみ
// listeners/attributes を適用し、アクションボタン（IconButton）はドラッグ不可のままにする。
function BlockListItem({ id, content, actions }: BlockListItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  return (
    <Paper
      ref={setNodeRef}
      data-testid="block-item"
      style={{ transform: CSS.Transform.toString(transform), transition }}
      variant="outlined"
      sx={{
        p: 1.5,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1,
      }}
    >
      <Box
        data-testid="drag-handle"
        {...attributes}
        {...listeners}
        sx={{ display: "flex", alignItems: "center", cursor: "grab" }}
      >
        <DragIndicatorIcon fontSize="small" />
      </Box>
      {content}
      <Stack direction="row" spacing={0.5}>
        {actions}
      </Stack>
    </Paper>
  );
}

interface ActionIconButtonProps {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

// Tooltip + IconButton の組み合わせも両エリアで重複していたため切り出す。
// title と aria-label は同じ文言（label）を共有する。
function ActionIconButton({
  label,
  icon,
  onClick,
  disabled,
}: ActionIconButtonProps) {
  return (
    <Tooltip title={label}>
      <span>
        <IconButton
          aria-label={label}
          size="small"
          onClick={onClick}
          disabled={disabled}
        >
          {icon}
        </IconButton>
      </span>
    </Tooltip>
  );
}

interface UnusedBlockAreaProps {
  blockIds: number[];
  blockById: Map<number, PuzzleBlock>;
  onMoveToAnswer: (id: number) => void;
}

// 「利用しないエリア」の描画のみを担当する。ReorderPuzzle 本体から
// このエリア固有の JSX を切り出し、解答エリアの描画ロジックと責務を分離する。
function UnusedBlockArea({
  blockIds,
  blockById,
  onMoveToAnswer,
}: UnusedBlockAreaProps) {
  const { setNodeRef } = useDroppable({ id: UNUSED_AREA_ID });

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        利用しないブロック
      </Typography>
      <Box
        ref={setNodeRef}
        data-testid="unused-blocks-area"
        sx={{
          minHeight: 80,
          p: 1,
          border: "1px dashed",
          borderColor: "divider",
          borderRadius: 1,
        }}
      >
        <SortableContext
          items={blockIds}
          strategy={verticalListSortingStrategy}
        >
          <Stack spacing={1}>
            {blockIds.map((id) => (
              <BlockListItem
                key={id}
                id={id}
                content={blockById.get(id)?.content ?? ""}
                actions={
                  <ActionIconButton
                    label={MOVE_TO_ANSWER_LABEL}
                    icon={<ArrowForwardIcon fontSize="small" />}
                    onClick={() => onMoveToAnswer(id)}
                  />
                }
              />
            ))}
          </Stack>
        </SortableContext>
      </Box>
    </Box>
  );
}

interface AnswerBlockAreaProps {
  blockIds: number[];
  blockById: Map<number, PuzzleBlock>;
  onMoveUp: (id: number) => void;
  onMoveDown: (id: number) => void;
  onReturnToUnused: (id: number) => void;
}

// 「解答エリア」の描画のみを担当する。先頭/末尾判定など解答エリア固有の
// ロジックをここに閉じ込め、ReorderPuzzle 本体を状態管理に専念させる。
function AnswerBlockArea({
  blockIds,
  blockById,
  onMoveUp,
  onMoveDown,
  onReturnToUnused,
}: AnswerBlockAreaProps) {
  const { setNodeRef } = useDroppable({ id: ANSWER_AREA_ID });

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        解答エリア
      </Typography>
      <Box
        ref={setNodeRef}
        data-testid="answer-blocks-area"
        sx={{
          minHeight: 80,
          p: 1,
          border: "1px dashed",
          borderColor: "divider",
          borderRadius: 1,
        }}
      >
        <SortableContext
          items={blockIds}
          strategy={verticalListSortingStrategy}
        >
          <Stack spacing={1}>
            {blockIds.map((id, index) => {
              // 先頭/末尾のブロックでは対応する移動ボタンを無効化する。
              // 判定式に名前を与えることで、下の disabled 指定の意図を明確にする。
              const isFirstBlock = index === 0;
              const isLastBlock = index === blockIds.length - 1;
              return (
                <BlockListItem
                  key={id}
                  id={id}
                  content={blockById.get(id)?.content ?? ""}
                  actions={
                    <>
                      <ActionIconButton
                        label={MOVE_UP_LABEL}
                        icon={<ArrowUpwardIcon fontSize="small" />}
                        onClick={() => onMoveUp(id)}
                        disabled={isFirstBlock}
                      />
                      <ActionIconButton
                        label={MOVE_DOWN_LABEL}
                        icon={<ArrowDownwardIcon fontSize="small" />}
                        onClick={() => onMoveDown(id)}
                        disabled={isLastBlock}
                      />
                      <ActionIconButton
                        label={RETURN_TO_UNUSED_LABEL}
                        icon={<ArrowBackIcon fontSize="small" />}
                        onClick={() => onReturnToUnused(id)}
                      />
                    </>
                  }
                />
              );
            })}
          </Stack>
        </SortableContext>
      </Box>
    </Box>
  );
}

// 配列をシャッフルした新しい配列を返す（Fisher-Yates）。back
// （PublicSangakuDetailSerializer）が毎回シャッフルして code_blocks を返す契約だが、
// それだけに全面的に依存すると、万一 back のシャッフルが機能しない場合に正解順
// （id 昇順）のまま出題されてしまう。front 側でも独立してシャッフルすることで
// 多層防御にする（quick-review 指摘）。
function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export default function ReorderPuzzle({
  sangakuId,
  blocks,
  title,
  description,
}: Props) {
  const blockById = useMemo(
    () => new Map(blocks.map((block) => [block.id, block])),
    [blocks],
  );

  // 初期値の計算にのみシャッフルを使う（useState の初期化関数は初回レンダーの
  // 1回だけ評価されるため、再レンダーのたびに並びが変わることはない）。
  const [unusedBlockIds, setUnusedBlockIds] = useState<number[]>(() =>
    shuffle(blocks.map((block) => block.id)),
  );
  const [answerBlockIds, setAnswerBlockIds] = useState<number[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // --- ボタン操作用の状態更新ロジック ---
  // 「解答エリアへ移動」「利用しないエリアへ戻す」「上へ」「下へ」の各ボタンに
  // 対応する状態更新の実体。後述の D&D ハンドラ（handleDragOver/handleDragEnd）は
  // ドラッグ操作がボタン操作と同じ結果になる場面でこれらをそのまま呼び出して
  // 再利用するため、状態更新ロジックの実体はここに一本化する。
  function moveToAnswerArea(id: number) {
    setUnusedBlockIds((prev) => removeBlockId(prev, id));
    setAnswerBlockIds((prev) => appendBlockId(prev, id));
  }

  function returnToUnusedArea(id: number) {
    setAnswerBlockIds((prev) => removeBlockId(prev, id));
    setUnusedBlockIds((prev) => appendBlockId(prev, id));
  }

  function moveUp(id: number) {
    setAnswerBlockIds((prev) => moveBlockUp(prev, id));
  }

  function moveDown(id: number) {
    setAnswerBlockIds((prev) => moveBlockDown(prev, id));
  }

  // --- ドラッグ＆ドロップ関連ロジック ---
  // 上記のボタン操作ロジックを再利用しつつ、ドラッグ操作特有の
  // 「今どちらのコンテナ上にあるか」の判定（findContainer）を行う。

  // ドラッグ中の id（ブロック id、またはコンテナ自体の droppable id）が
  // どちらのエリアに属するかを判定する。
  // 引数の型は active.id / over.id の型（dnd-kit の UniqueIdentifier = string | number）
  // にそのまま合わせる。
  function findContainer(
    id: UniqueIdentifier,
  ): "unused" | "answer" | undefined {
    if (id === UNUSED_AREA_ID) return "unused";
    if (id === ANSWER_AREA_ID) return "answer";
    if (unusedBlockIds.includes(asBlockId(id))) return "unused";
    if (answerBlockIds.includes(asBlockId(id))) return "answer";
    return undefined;
  }

  // dnd-kit では「ドラッグ中に別のコンテナへ入った瞬間」を検知できるのは
  // onDragOver のみ（onDragEnd はドロップ完了時に一度だけ発火する）。
  // そのため、unused → answer のようにコンテナをまたぐ移動はここで検知し、
  // ドロップを待たずに即座に state を更新する。
  // 同一コンテナ内の並べ替え（例: 解答エリア内でブロックの順序を変える）は
  // ドラッグ中は state を変えず、ドロップが確定してから handleDragEnd で処理する。
  // unused エリアから answer エリアへの移動、および answer エリアから
  // unused エリアへ戻す移動は互いに排他的（activeContainer は同時に両方には
  // ならない）なので else if で対にし、片方だけが実行されることを示す。
  //
  // over が個々のブロック（isContainerId が false）を指している場合は、
  // insertBlockIdBefore でそのブロックの位置に挿入する。ドラッグ中のカーソル位置
  // （視覚的な挿入位置）と最終結果を一致させるため、ボタン操作用の
  // moveToAnswerArea/returnToUnusedArea（常に末尾へ追加）は再利用しない。
  // over がコンテナ自体の余白を指している場合（isContainerId が true）は
  // insertBlockIdBefore が targetId を見つけられず末尾へフォールバックする。
  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(over.id);
    if (activeContainer === overContainer || !activeContainer || !overContainer) {
      return;
    }

    const activeId = asBlockId(active.id);
    const overId = isContainerId(over.id) ? activeId : asBlockId(over.id);
    if (activeContainer === "unused" && overContainer === "answer") {
      setUnusedBlockIds((prev) => removeBlockId(prev, activeId));
      setAnswerBlockIds((prev) => insertBlockIdBefore(prev, activeId, overId));
    } else if (activeContainer === "answer" && overContainer === "unused") {
      setAnswerBlockIds((prev) => removeBlockId(prev, activeId));
      setUnusedBlockIds((prev) => insertBlockIdBefore(prev, activeId, overId));
    }
  }

  // 同一コンテナ内でのドラッグによる並べ替え（例: 解答エリア内で最後尾のブロックを
  // 先頭にドラッグする）を扱う。異なるコンテナ間の移動は handleDragOver で
  // 処理済みのため、ここに来る時点で active/over は同じコンテナに属している。
  //
  // over がコンテナ自体の余白（isContainerId が true）を指している場合は
  // 「末尾へ移動」として扱う。isContainerId で明示的に分岐せず asBlockId(over.id) を
  // そのまま indexOf に渡すと常に -1 になり arrayMove の負インデックス挙動に
  // 結果を委ねることになるが、これは偶然の安全性に依存する脆い実装だったため、
  // 意図を明示する形に変更する。
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(over.id);
    if (
      activeContainer &&
      activeContainer === overContainer &&
      active.id !== over.id
    ) {
      // unused / answer どちらのコンテナでも「配列内の要素を入れ替える」処理は
      // 同じ arrayMove ロジックのため、対象コンテナの setter だけを
      // 切り替えて共通化し、同じ処理を2回書くことを避ける。
      const setBlockIds =
        activeContainer === "unused" ? setUnusedBlockIds : setAnswerBlockIds;
      setBlockIds((prev) => {
        const oldIndex = prev.indexOf(asBlockId(active.id));
        const newIndex = isContainerId(over.id)
          ? prev.length - 1
          : prev.indexOf(asBlockId(over.id));
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  }

  async function submitAnswer() {
    if (window.confirm("解答を終了しますか？")) {
      // createAnswer の戻り値（State型）は意図的に無視している。
      // CreateForm.tsx の postAnswerAction とは異なり、この画面では
      // block_ids に対するフィールド単位のエラー（State.errors）は
      // 定義されておらず、成功/失敗の通知は createAnswer 内部の
      // setFlash・redirect で完結する。将来 block_ids 用のフィールド
      // エラーを State に追加する場合は、ここでも戻り値を受け取り
      // useActionState 等で表示する対応が必要になる。
      await createAnswer(sangakuId, { block_ids: answerBlockIds });
    }
  }

  return (
    <DndContext
      sensors={sensors}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <Grid container spacing={2} columns={{ xs: 6, md: 12 }} sx={{ width: "100%" }}>
        <Grid size={6}>
          <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
            {title}
          </Typography>
          <Box
            height="65vh"
            sx={{ p: 1, backgroundColor: "primary.main", overflowY: "auto" }}
          >
            <MarkdownPreview content={description} />
          </Box>
        </Grid>
        <Grid size={6}>
          <AnswerBlockArea
            blockIds={answerBlockIds}
            blockById={blockById}
            onMoveUp={moveUp}
            onMoveDown={moveDown}
            onReturnToUnused={returnToUnusedArea}
          />
          <UnusedBlockArea
            blockIds={unusedBlockIds}
            blockById={blockById}
            onMoveToAnswer={moveToAnswerArea}
          />
          <Box display="flex" justifyContent="end">
            <Button
              variant="contained"
              disabled={answerBlockIds.length === 0}
              onClick={submitAnswer}
            >
              解答を終了する
            </Button>
          </Box>
        </Grid>
      </Grid>
    </DndContext>
  );
}
