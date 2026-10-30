"use client";

import type { Sangaku } from "@/app/lib/definitions";
import { startTransition, useState } from "react";
import Ema from "@/app/ui/Ema";
import { Box, ButtonBase, Typography } from "@mui/material";
import Grid from "@mui/material/Grid";
import Pagination from "@/app/ui/Pagination";
import Modal from "./Modal";
import {
  fetchSangakuModalDetail,
  type SangakuModalDetail,
} from "@/app/lib/sangaku-detail";
import { difficultyTranslation } from "../utility";

interface Props {
  sangakus: Sangaku[];
  totalPage: number;
}

export default function DedicatedSangakuListView({
  sangakus,
  totalPage,
}: Props) {
  const [selected, setSelected] = useState<{
    id: string;
    detail: Promise<SangakuModalDetail>;
  } | null>(null);
  // 選択中の算額は、複製を state に持たず、id から props を引く。
  const selectedSangaku = sangakus.find((s) => s.id === selected?.id) ?? null;

  // Promise は render 中ではなくクリックで生成する。Suspense 内の子で生成すると、
  // 初回 mount で suspend した際に state が破棄され、毎回作り直されてしまう。
  // Server Function は Transition 内で呼ぶ（React のドキュメントの注意事項）。
  const handleClick = (sangaku: Sangaku) => {
    startTransition(() => {
      setSelected({ id: sangaku.id, detail: fetchSangakuModalDetail(sangaku) });
    });
  };

  // updater の中で fetch すると StrictMode で二重実行されるため、取得は外で行う。
  const handleRetry = () => {
    if (!selectedSangaku) return;
    const sangaku = selectedSangaku;
    startTransition(() => {
      const detail = fetchSangakuModalDetail(sangaku);
      setSelected((current) =>
        current?.id === sangaku.id ? { ...current, detail } : current,
      );
    });
  };

  const handleClose = () => {
    setSelected(null);
  };

  return (
    <>
      <Grid
        container
        direction="row"
        spacing={3}
        sx={{
          justifyContent: "center",
          alignItems: "flex-start",
          mt: 3,
          mb: 2,
        }}
      >
        {sangakus.map((sangaku) => (
          <div
            key={sangaku.id}
            style={{
              filter: "drop-shadow(3px 3px 2px #aaa)",
            }}
          >
            <ButtonBase
              key={sangaku.id}
              onClick={() => {
                handleClick(sangaku);
              }}
              sx={{
                clipPath:
                  "polygon(0% 25%, 0% 100%, 100% 100%, 100% 25%, 50% 0%)",
                boxShadow: 3,
              }}
            >
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
                    {sangaku.attributes.title}
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
                    {sangaku.attributes.description}
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
                      {difficultyTranslation(sangaku.attributes.difficulty)}
                    </Typography>
                  </Box>
                </Box>
              </Ema>
            </ButtonBase>
          </div>
        ))}
        <Modal
          data={selectedSangaku}
          detail={selected?.detail ?? null}
          onRetry={handleRetry}
          handleClose={handleClose}
        />
      </Grid>
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <Pagination totalPage={totalPage} />
      </Box>
    </>
  );
}
