import { useEffect, useState } from "react";
import type { Sangaku, Shrine, SangakuResult } from "@/app/lib/definitions";
import {
  Modal,
  Box,
  SxProps,
  Typography,
  CircularProgress,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
// import { Editor } from "@monaco-editor/react";
import { difficultyTranslation } from "@/app/ui/utility";
import Ema from "@/app/ui/Ema";
import { fetchShrine } from "@/app/lib/data/shrine";
import { fetchUserSangakuResult } from "@/app/lib/data/sangaku";

interface Props {
  data: Sangaku | null;
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
export default function ModalComponent({ data, handleClose }: Props) {
  const [shrine, setShrine] = useState<Shrine | null>(null);
  const [results, setResult] = useState<SangakuResult | null | undefined>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    (async () => {
      if (!!data) {
        setIsLoading(true);
        const [shrineData, resultData] = await Promise.all([
          await fetchShrine(data!.relationships.shrine.data!.id),
          await fetchUserSangakuResult(data!.id),
        ]);
        setResult(resultData);
        setShrine(shrineData);
        setIsLoading(false);
      }
    })();
  }, [data]);

  return (
    <Modal open={!!data} onClose={handleClose}>
      <Box
        sx={{ ...style, width: { xs: 380, sm: 600, md: 800 } }}
        aria-label="modal"
      >
        {isLoading && (
          <Box display="flex" justifyContent="center" alignItems="center" p={5}>
            <CircularProgress size={200} />
          </Box>
        )}
        {isLoading ||
          (data && results && (
            <Grid
              container
              spacing={2}
              width="100%"
              columns={{ xs: 6, md: 12 }}
              sx={{ mb: 2 }}
            >
              <Grid size={6}>
                <Typography variant="h4" sx={{ mb: 2 }}>
                  {shrine?.attributes.name}
                </Typography>
                <Box display="flex" justifyContent="center" sx={{ mb: 2 }}>
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
                        {data!.attributes.title}
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
                          {difficultyTranslation(data!.attributes.difficulty)}
                        </Typography>
                      </Box>
                    </Box>
                  </Ema>
                </Box>
                <Box p={5}>
                  <Typography
                    variant="inherit"
                    fontWeight="bold"
                    fontSize={18}
                    mb={1}
                  >
                    算額が写された数:{" "}
                    {results!.attributes.user_sangaku_save_count}
                  </Typography>
                  <Typography
                    variant="inherit"
                    fontWeight="bold"
                    fontSize={18}
                    mb={1}
                  >
                    明察: {results!.attributes.correct_count}
                  </Typography>
                  <Typography
                    variant="inherit"
                    fontWeight="bold"
                    fontSize={18}
                    mb={1}
                  >
                    誤謬: {results!.attributes.incorrect_count}
                  </Typography>
                </Box>
              </Grid>
              <Grid size={6}>
                <Typography
                  height="60vh"
                  sx={{ p: 1.5, backgroundColor: "primary.main" }}
                >
                  {data.attributes.description}
                </Typography>
              </Grid>
            </Grid>
          ))}
      </Box>
    </Modal>
  );
}
