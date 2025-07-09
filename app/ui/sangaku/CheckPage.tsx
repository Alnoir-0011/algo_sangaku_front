import { SxProps } from "@mui/material";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";
import { Dispatch, SetStateAction } from "react";
import { Editor } from "@monaco-editor/react";
import Grid from "@mui/material/Grid2";
import SourceResult from "@/app/ui/sangaku/SourceResult";

interface Props {
  useModal: () => [boolean, Dispatch<SetStateAction<boolean>>];
  source: string;
  fixedInputs: string[];
}

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

const readOnlyMessage = {
  value: "このエディタでは編集できません\n作成画面に戻り編集してください",
};

export default function CheckPage({ useModal, source, fixedInputs }: Props) {
  const [modalOpen, setModalOpen] = useModal();

  const closeModal = () => setModalOpen(false);

  return (
    <Modal disableEnforceFocus open={modalOpen}>
      <Box sx={{ ...style, width: { xs: 380, sm: 600, md: 800 } }}>
        <Grid container spacing={1} sx={{ mb: 2, width: "100%" }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Editor
              defaultLanguage="ruby"
              height="500px"
              theme="vs-dark"
              options={{ readOnly: true, readOnlyMessage }}
              value={source}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }} aria-label="sourceResult">
            実行結果
            <SourceResult source={source} fixedInputs={fixedInputs} />
          </Grid>
        </Grid>
        <Box sx={{ display: "flex", justifyContent: "space-around" }}>
          <Button variant="contained" onClick={closeModal}>
            作成画面に戻る
          </Button>
          <Button variant="contained" type="submit" form="sangaku_form">
            保存する
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}
