import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { Sangaku, Shrine } from "@/app/lib/definitions";
import {
  Modal,
  Box,
  SxProps,
  Typography,
  Button,
  Stack,
  Paper,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import { Editor } from "@monaco-editor/react";
import { dedicateSangaku } from "@/app/lib/actions/shrine";
import { fetchUserSangaku } from "@/app/lib/data/sangaku";
import { difficultyTranslation } from "@/app/ui/utility";
import { ShareButton } from "./ShareButton";
import Ema from "@/app/ui/Ema";

interface Props {
  data: Sangaku | null;
  shrine: Shrine;
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

// 並べ替え形式のブロックラベル。correct_position が number のときはその番号、
// null/undefined（ダミーブロック、または未取得状態）のときは DUMMY_LABEL を表示する。
// CodeBlock.correct_position の型（number | null | undefined）を素直に反映するため
// 分岐に ?? を使い、0 番（あり得るなら）を誤ってダミー扱いしないようにする。
const DUMMY_LABEL = "ダミー";

export default function ConfirmModal({ data, shrine, handleClose }: Props) {
  const [currentPosition, setCurrentPosition] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [isDedicated, setIsDedicated] = useState(false);
  const [reorderData, setReorderData] = useState<Sangaku | null>(null);
  // fetchUserSangaku が失敗（null/undefined）した場合に「読み込み中...」のまま
  // 固まってしまわないよう、失敗状態を区別して保持する。retryKey を更新すると
  // 下の useEffect が再実行され、再試行できる。
  const [reorderFetchFailed, setReorderFetchFailed] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const { id: shrine_id } = useParams<{ id: string }>();

  useEffect(() => {
    (async () => {
      const newLatLng = await getLocation();
      setCurrentPosition(newLatLng);
    })();
  }, [setCurrentPosition]);

  useEffect(() => {
    if (data?.attributes.kind !== "reorder") {
      return;
    }

    // data.id の変化（別の reorder 算額への切り替え）で古いレスポンスが
    // 後から解決して新しいレスポンスを上書きしないよう、ignore フラグで無効化する。
    // 併せて取得中は前回の reorderData を表示し続けないよう、開始時点で null に戻す。
    let ignore = false;
    setReorderData(null);
    setReorderFetchFailed(false);

    (async () => {
      const result = await fetchUserSangaku(data.id);
      if (ignore) return;
      if (result) {
        setReorderData(result);
      } else {
        setReorderFetchFailed(true);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [data?.id, data?.attributes.kind, retryKey]);

  return (
    <Modal open={!!data} onClose={handleClose}>
      <Box
        sx={{ ...style, width: { xs: 380, sm: 600, md: 800 } }}
        role="dialog"
      >
        {isDedicated || (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (
                await dedicateSangaku(shrine_id, data!.id, currentPosition!)
              ) {
                setIsDedicated(true);
              }
            }}
          >
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
            >
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
            {data?.attributes.kind === "reorder" ? (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  {data?.attributes.description}
                </Typography>
                {reorderData ? (
                  <Stack spacing={1}>
                    {reorderData.attributes.code_blocks?.map((block, index) => (
                      <Paper
                        key={block.id}
                        variant="outlined"
                        data-testid={`confirm-modal-code-block-${index + 1}`}
                        sx={{ display: "flex", alignItems: "center", p: 1 }}
                      >
                        <Box
                          sx={{
                            width: 40,
                            textAlign: "center",
                            fontWeight: "bold",
                            mr: 1,
                          }}
                        >
                          {block.correct_position ?? DUMMY_LABEL}
                        </Box>
                        <Typography>{block.content}</Typography>
                      </Paper>
                    ))}
                  </Stack>
                ) : reorderFetchFailed ? (
                  <Box>
                    <Typography variant="body2" color="error" sx={{ mb: 1 }}>
                      コードブロックの取得に失敗しました
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      type="button"
                      onClick={() => setRetryKey((key) => key + 1)}
                    >
                      再試行
                    </Button>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    読み込み中...
                  </Typography>
                )}
              </Box>
            ) : (
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
            )}
            <Box sx={{ display: "flex", justifyContent: "space-around" }}>
              <Button variant="contained" onClick={handleClose}>
                戻る
              </Button>
              <Button variant="contained" type="submit">
                この算額を奉納する
              </Button>
            </Box>
          </form>
        )}
        {isDedicated && data && (
          <Box>
            <Typography variant="h4" sx={{ mb: 2 }}>
              算額を奉納しました
            </Typography>
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
                    {data!.attributes.title}
                  </Typography>
                  <Typography
                    variant="inherit"
                    sx={{
                      mb: 1,
                      textAlign: "center",
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      textOverflow: "ellipsis",
                      whiteSpace: "pre-line",
                    }}
                  >
                    {data!.attributes.description}
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "start",
                      alignItems: "center",
                      marginTop: "auto",
                    }}
                  >
                    <Typography sx={{ mr: "auto" }}>
                      {data!.attributes.author_name}
                    </Typography>
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
            <ShareButton shrine={shrine} title={data!.attributes.title!} />
          </Box>
        )}
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
        /* v8 ignore next */
        (e) => rejects(e),
      );
    }
  }).then((position) => {
    return position;
  });
}
