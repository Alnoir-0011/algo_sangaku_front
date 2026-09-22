import { SxProps } from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import type { CodeBlockDraft } from "@/app/ui/sangaku/reorder/CodeBlockEditor";
import { assignCorrectPositions } from "@/app/ui/sangaku/reorder/codeBlockPosition";

interface Props {
  open: boolean;
  onClose: () => void;
  blocks: CodeBlockDraft[];
  formId: string;
}

const DUMMY_LABEL = "ダミー";

const style: SxProps = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  boxShadow: 24,
  pt: 2,
  px: 2,
  pb: 3,
  borderRadius: 1,
};

// 各ブロックの表示ラベルを算出する。isDummy なブロックは DUMMY_LABEL 固定表示、
// それ以外は非ダミーブロックのみをカウントした連番（correct_position 相当）を表示する。
// 連番の算出自体は ReorderSangakuForm.tsx の送信ペイロード変換と共通のため
// assignCorrectPositions に委譲し、ここでは表示用ラベルへの変換のみを行う。
// （CodeBlockEditor.tsx の分割・結合操作で配列が変化しても、blocks の並び順のみから
// 毎回ラベルを再計算する）
function buildBlockLabels(blocks: CodeBlockDraft[]): string[] {
  return assignCorrectPositions(blocks).map((position) =>
    position === null ? DUMMY_LABEL : String(position),
  );
}

export default function ReorderCheckPage({
  open,
  onClose,
  blocks,
  formId,
}: Props) {
  const labels = buildBlockLabels(blocks);

  return (
    <Modal disableEnforceFocus open={open} onClose={onClose}>
      <Box
        sx={{ ...style, width: { xs: 380, sm: 600, md: 800 } }}
        data-testid="reorder-check-page-modal"
      >
        <Stack spacing={1.5} sx={{ mb: 2 }}>
          {blocks.map((block, index) => (
            <Paper
              key={index}
              variant="outlined"
              sx={{ p: 1.5, display: "flex", alignItems: "center", gap: 1 }}
              // "reorder-check-page-block-{index}" は blocks を配列の並び順のまま
              // 表示するという仕様、および CodeBlockEditor.tsx の
              // block-content-{index} と同様の識別子パターンに倣った、
              // テストが各ブロックを識別するための暫定 testid
              data-testid={`reorder-check-page-block-${index}`}
            >
              <Box
                sx={{
                  minWidth: 32,
                  fontWeight: block.isDummy ? "normal" : "bold",
                  color: block.isDummy ? "text.secondary" : "text.primary",
                }}
              >
                {labels[index]}
              </Box>
              <Box>{block.content}</Box>
            </Paper>
          ))}
        </Stack>
        <Box sx={{ display: "flex", justifyContent: "space-around" }}>
          <Button variant="contained" onClick={onClose}>
            作成画面に戻る
          </Button>
          <Button variant="contained" type="submit" form={formId}>
            保存する
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}
