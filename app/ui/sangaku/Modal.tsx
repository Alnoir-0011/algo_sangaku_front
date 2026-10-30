import { Suspense, use } from "react";
import type { Sangaku } from "@/app/lib/definitions";
import type { SangakuModalDetail } from "@/app/lib/sangaku-detail";
import {
  Modal,
  Box,
  SxProps,
  Typography,
  CircularProgress,
} from "@mui/material";
import Grid from "@mui/material/Grid";
// import { Editor } from "@monaco-editor/react";
import { difficultyTranslation } from "@/app/ui/utility";
import Ema from "@/app/ui/Ema";

interface Props {
  data: Sangaku | null;
  detail: Promise<SangakuModalDetail> | null;
  handleClose: () => void;
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

function SangakuModalContent({
  data,
  detail,
}: {
  data: Sangaku;
  detail: Promise<SangakuModalDetail>;
}) {
  const { shrine, result: results } = use(detail);

  if (!results) {
    return (
      <Typography color="error" sx={{ p: 2 }}>
        算額の情報の取得に失敗しました
      </Typography>
    );
  }

  return (
    <Grid
      container
      spacing={2}
      columns={{ xs: 6, md: 12 }}
      sx={{ width: "100%", mb: 2 }}
    >
      <Grid size={6}>
        {shrine && (
          <Typography variant="h4" sx={{ mb: 2 }}>
            {shrine.attributes.name}
          </Typography>
        )}
        <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
          <Ema width={18}>
            <Box
              sx={{
                display: "flex",
                height: "100%",
                flexDirection: "column",
                justifyContent: "start",
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  mb: 1,
                  textAlign: "center",
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: "vertical",
                  textOverflow: "ellipsis",
                  whiteSpace: "pre-line",
                }}
              >
                {data.attributes.title}
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "end",
                  marginTop: "auto",
                }}
              >
                <Typography
                  component="p"
                  sx={{
                    px: 1,
                    py: 0.5,
                    border: 1,
                    borderRadius: 2,
                    textAlign: "right",
                  }}
                >
                  {difficultyTranslation(data.attributes.difficulty)}
                </Typography>
              </Box>
            </Box>
          </Ema>
        </Box>
        <Box sx={{ p: 5 }}>
          <Typography
            variant="inherit"
            sx={{ fontWeight: "bold", fontSize: 18, mb: 1 }}
          >
            算額が写された数:{" "}
            {results.attributes.user_sangaku_save_count}
          </Typography>
          <Typography
            variant="inherit"
            sx={{ fontWeight: "bold", fontSize: 18, mb: 1 }}
          >
            明察: {results.attributes.correct_count}
          </Typography>
          <Typography
            variant="inherit"
            sx={{ fontWeight: "bold", fontSize: 18, mb: 1 }}
          >
            誤謬: {results.attributes.incorrect_count}
          </Typography>
        </Box>
      </Grid>
      <Grid size={6}>
        <Typography
          sx={{
            height: "60vh",
            p: 1.5,
            backgroundColor: "primary.main",
          }}
        >
          {data.attributes.description}
        </Typography>
      </Grid>
    </Grid>
  );
}

export default function ModalComponent({ data, detail, handleClose }: Props) {
  return (
    <Modal open={!!data} onClose={handleClose}>
      <Box
        sx={{ ...style, width: { xs: 380, sm: 600, md: 800 } }}
        role="dialog"
      >
        {data && detail && (
          <Suspense
            fallback={
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  p: 5,
                }}
              >
                <CircularProgress size={200} />
              </Box>
            }
          >
            <SangakuModalContent data={data} detail={detail} />
          </Suspense>
        )}
      </Box>
    </Modal>
  );
}
