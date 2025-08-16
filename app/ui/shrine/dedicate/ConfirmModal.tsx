import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Sangaku } from "@/app/lib/definitions";
import { Modal, Box, SxProps, Typography, Button } from "@mui/material";
import Grid from "@mui/material/Grid2";
import { Editor } from "@monaco-editor/react";
import { dedicateSangaku } from "@/app/lib/actions/shrine";
import { difficultyTranslation } from "@/app/ui/utility";

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

const readOnlyMessage = {
  value: "このエディタでは編集できません\n作成画面に戻り編集してください",
};

export default function ConfirmModal({ data, handleClose }: Props) {
  const [currentPosition, setCurrnetPosition] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const { id: shrine_id } = useParams<{ id: string }>();

  useEffect(() => {
    (async () => {
      const newLatLng = await getLocation();
      setCurrnetPosition(newLatLng);
    })();
  }, [setCurrnetPosition]);

  return (
    <Modal open={!!data} onClose={handleClose}>
      <Box
        sx={{ ...style, width: { xs: 380, sm: 600, md: 800 } }}
        aria-label="confirm-modal"
      >
        <form
          action={() => {
            dedicateSangaku(shrine_id, data!.id, currentPosition!);
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography variant="h4">{data?.attributes.title}</Typography>
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
                {data && difficultyTranslation(data.attributes.difficulty)}
              </Typography>
            </Box>
          </Box>
          <Grid container spacing={1} sx={{ mb: 2, width: "100%" }}>
            <Grid
              size={{ xs: 12, sm: 6 }}
              sx={{ display: "flex", flexDirection: "column" }}
            >
              <Typography variant="body1" sx={{ flexGrow: 1 }}>
                {data?.attributes.description}
              </Typography>
              <Box>
                解答チェック用入力
                <Box
                  sx={{
                    border: "1px solid black",
                    borderRadius: 2,
                    overflow: "hidden",
                    width: "100%",
                  }}
                >
                  {data?.attributes.inputs.map((value, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: "flex",
                        borderBottom: "1px solid gray",
                      }}
                    >
                      <Box
                        sx={{
                          borderRight: "1px solid gray",
                          width: 30,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: "bold",
                        }}
                      >
                        {index + 1}
                      </Box>
                      <Box sx={{ flexGrow: 1, p: 1 }}>
                        <Typography aria-label={`result-${index + 1}`}>
                          {value.content}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Editor
                defaultLanguage="ruby"
                height="500px"
                theme="vs-dark"
                options={{ readOnly: true, readOnlyMessage }}
                value={data?.attributes.source}
              />
            </Grid>
          </Grid>
          <Box sx={{ display: "flex", justifyContent: "space-around" }}>
            <Button variant="contained" onClick={handleClose}>
              戻る
            </Button>
            <Button variant="contained" type="submit">
              この算額を奉納する
            </Button>
          </Box>
        </form>
      </Box>
    </Modal>
  );
}

async function getLocation() {
  return new Promise<{ lat: number; lng: number }>((resolve, rejects) => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (e) => rejects(e),
      );
    }
  }).then((position) => {
    return position;
  });
}
