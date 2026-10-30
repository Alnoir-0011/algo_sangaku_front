"use client";

import type { Sangaku, Shrine } from "@/app/lib/definitions";
import { startTransition, useState } from "react";
import Ema from "@/app/ui/Ema";
import { Box, ButtonBase, Typography } from "@mui/material";
import Grid from "@mui/material/Grid";
import Pagination from "@/app/ui/Pagination";
import ConfirmModal from "./ConfirmModal";
import { fetchReorderDetail, type ReorderDetail } from "@/app/lib/sangaku-detail";
import { difficultyTranslation } from "../../utility";

interface Props {
  sangakus: Sangaku[];
  totalPage: number;
  shrine: Shrine;
}

export default function SangakuListView({
  sangakus,
  totalPage,
  shrine,
}: Props) {
  const [selected, setSelected] = useState<{
    id: string;
    reorderDetail: ReorderDetail | null;
  } | null>(null);
  // 選択中の算額は、複製を state に持たず、id から props を引く。
  const selectedSangaku = sangakus.find((s) => s.id === selected?.id) ?? null;

  // Promise は render 中ではなくクリックで生成する。Suspense 内の子で生成すると、
  // 初回 mount で suspend した際に state が破棄され、毎回作り直されてしまう。
  // Server Function は Transition 内で呼ぶ（React のドキュメントの注意事項）。
  const handleClick = (sangaku: Sangaku) => {
    startTransition(() => {
      setSelected({
        id: sangaku.id,
        reorderDetail:
          sangaku.attributes.kind === "reorder"
            ? fetchReorderDetail(sangaku.id)
            : null,
      });
    });
  };

  // updater の中で fetch すると StrictMode で二重実行されるため、取得は外で行い、
  // 別の算額に切り替わっていた場合だけ差し替えを捨てる。
  const handleRetryReorder = () => {
    if (!selected) return;
    const id = selected.id;
    startTransition(() => {
      const reorderDetail = fetchReorderDetail(id);
      setSelected((current) =>
        current?.id === id ? { ...current, reorderDetail } : current,
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
        <ConfirmModal
          data={selectedSangaku}
          reorderDetail={selected?.reorderDetail ?? null}
          onRetryReorder={handleRetryReorder}
          handleClose={handleClose}
          shrine={shrine}
        />
      </Grid>
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <Pagination totalPage={totalPage} />
      </Box>
    </>
  );
}
